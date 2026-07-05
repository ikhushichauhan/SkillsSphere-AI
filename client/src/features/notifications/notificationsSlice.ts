import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as notificationService from "../../services/notificationService";
import { RootState } from "../../store";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  socketStatus: "idle" | "connected" | "disconnected" | "error" | "reconnecting";
  pagination: PaginationData;
  error: string | null;
  
  // Transient rollback states for optimistic updates
  _rollbackUnreadIds?: string[] | null;
  _rollbackDeletedItem?: AppNotification | null;
  _rollbackSnapshot?: {
    items: AppNotification[];
    unreadCount: number;
    pagination: PaginationData;
  } | null;
  _rollbackBulkDeletedItems?: AppNotification[] | null;
}

// Ensure no stray characters here
// Helper to convert async errors to readable messages
const toErrorMessage = (error: unknown, fallback: string) =>
  (error as Error)?.message || fallback || "An unexpected error occurred.";

/**
 * Fetch paginated list of notifications
 */
export const getNotifications = createAsyncThunk<
  { data: AppNotification[]; pagination: PaginationData },
  { page?: number; limit?: number } | undefined,
  { state: RootState; rejectValue: string }
>("notifications/fetchAll", async (params, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    const response = await notificationService.fetchNotifications(token, params);
    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to load notifications"));
  }
});

/**
 * Fetch unread notifications count
 */
export const getUnreadCount = createAsyncThunk<
  { unreadCount: number },
  void,
  { state: RootState; rejectValue: string }
>("notifications/fetchUnreadCount", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    const response = await notificationService.fetchUnreadCount(token);
    return response.data;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to load unread count"));
  }
});

/**
 * Mark a single notification as read (with Optimistic UI updates)
 */
export const markAsRead = createAsyncThunk<
  AppNotification,
  string,
  { state: RootState; rejectValue: string }
>("notifications/markRead", async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    const response = await notificationService.markNotificationRead(id, token);
    return response.data;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to mark notification as read"));
  }
});

/**
 * Mark all user notifications as read (with Optimistic UI updates)
 */
export const markAllAsRead = createAsyncThunk<
  null,
  void,
  { state: RootState; rejectValue: string }
>("notifications/markAllRead", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    await notificationService.markAllNotificationsRead(token);
    return null;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to mark all as read"));
  }
});

/**
 * Delete a single notification (with Optimistic UI updates)
 */
export const deleteNotificationById = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("notifications/delete", async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    await notificationService.deleteNotification(id, token);
    return id;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to delete notification"));
  }
});

/**
 * Delete all notifications (with Optimistic UI updates)
 */
export const clearAllNotifications = createAsyncThunk<
  null,
  void,
  { state: RootState; rejectValue: string }
>("notifications/clearAll", async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    await notificationService.deleteAllNotifications(token);
    return null;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to clear notifications"));
  }
});

/**
 * Delete multiple notifications in bulk (with Optimistic UI updates)
 */
export const deleteNotificationsBulk = createAsyncThunk<
  string[],
  string[],
  { state: RootState; rejectValue: string }
>("notifications/deleteBulk", async (ids, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth?.token;
    if (!token) return thunkAPI.rejectWithValue("No auth token available");

    await notificationService.deleteNotificationsBulk(ids, token);
    return ids;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(toErrorMessage(error, "Failed to delete notifications in bulk"));
  }
});

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  socketStatus: "idle",
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addLiveNotification: (state, action: PayloadAction<AppNotification>) => {
      const notif = action.payload;
      const exists = state.items.some((item) => item._id === notif._id);
      
      if (!exists) {
        state.items.unshift(notif);
        if (!notif.isRead) {
          state.unreadCount += 1;
        }
        state.pagination.total += 1;
      }
    },
    setSocketStatus: (state, action: PayloadAction<NotificationsState["socketStatus"]>) => {
      state.socketStatus = action.payload;
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const requestedPage = Number(action.meta.arg?.page || 1);
        if (requestedPage === 1) {
          state.items = [];
          state.pagination = {
            ...state.pagination,
            page: 1,
            total: 0,
            pages: 1,
          };
        }
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        const { data: notifications = [], pagination } = action.payload;
        const safePagination: PaginationData = {
          page: Math.max(1, Number(pagination?.page || 1)),
          limit: Math.max(1, Number(pagination?.limit || 10)),
          total: Math.max(0, Number(pagination?.total || notifications.length)),
          pages: Math.max(1, Number(pagination?.pages || 1)),
        };

        if (safePagination.page === 1) {
          state.items = notifications;
        } else {
          const newItems = notifications.filter(
            (item) => !state.items.some((existing) => existing._id === item._id)
          );
          state.items = [...state.items, ...newItems];
        }
        
        state.pagination = safePagination;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "An error occurred";
      })

      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })

      .addCase(markAsRead.pending, (state, action) => {
        const id = action.meta.arg;
        const index = state.items.findIndex((item) => item._id === id);
        if (index !== -1 && !state.items[index].isRead) {
          state.items[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        const id = action.meta.arg;
        const index = state.items.findIndex((item) => item._id === id);
        if (index !== -1 && state.items[index].isRead) {
          state.items[index].isRead = false;
          state.unreadCount += 1;
        }
        state.error = action.payload ?? "An error occurred";
      })

      .addCase(markAllAsRead.pending, (state) => {
        if (!state._rollbackUnreadIds) {
          state._rollbackUnreadIds = state.items
            .filter((item) => !item.isRead)
            .map((item) => item._id);
        }
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state._rollbackUnreadIds = null;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        const unreadIds = state._rollbackUnreadIds;
        if (unreadIds && unreadIds.length > 0) {
          state.items.forEach((item) => {
            if (unreadIds.includes(item._id)) {
              item.isRead = false;
            }
          });
          state.unreadCount = unreadIds.length;
          state._rollbackUnreadIds = null;
        }
        state.error = action.payload ?? "An error occurred";
      })

      .addCase(deleteNotificationById.pending, (state, action) => {
        const id = action.meta.arg;
        const itemToDelete = state.items.find((item) => item._id === id);
        
        if (itemToDelete) {
          state._rollbackDeletedItem = itemToDelete;
          if (!itemToDelete.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.items = state.items.filter((item) => item._id !== id);
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteNotificationById.rejected, (state, action) => {
        const deleted = state._rollbackDeletedItem;
        if (deleted) {
          state.items.push(deleted);
          if (!deleted.isRead) {
            state.unreadCount += 1;
          }
          state.pagination.total += 1;
          state._rollbackDeletedItem = null;
        }
        state.error = action.payload ?? "An error occurred";
      })

      .addCase(clearAllNotifications.pending, (state) => {
        state._rollbackSnapshot = {
          items: state.items,
          unreadCount: state.unreadCount,
          pagination: state.pagination,
        };
        state.items = [];
        state.unreadCount = 0;
        state.pagination = initialState.pagination;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        const snapshot = state._rollbackSnapshot;
        if (snapshot) {
          state.items = snapshot.items;
          state.unreadCount = snapshot.unreadCount;
          state.pagination = snapshot.pagination;
          state._rollbackSnapshot = null;
        }
        state.error = action.payload ?? "An error occurred";
      })

      .addCase(deleteNotificationsBulk.pending, (state, action) => {
        const ids = action.meta.arg;
        const itemsToDelete = state.items.filter((item) => ids.includes(item._id));
        
        if (itemsToDelete.length > 0) {
          state._rollbackBulkDeletedItems = itemsToDelete;
          const unreadDeletedCount = itemsToDelete.filter((item) => !item.isRead).length;
          state.unreadCount = Math.max(0, state.unreadCount - unreadDeletedCount);
          state.items = state.items.filter((item) => !ids.includes(item._id));
          state.pagination.total = Math.max(0, state.pagination.total - itemsToDelete.length);
        }
      })
      .addCase(deleteNotificationsBulk.rejected, (state, action) => {
        const deletedItems = state._rollbackBulkDeletedItems;
        if (deletedItems && deletedItems.length > 0) {
          state.items = [...state.items, ...deletedItems];
          const unreadDeletedCount = deletedItems.filter((item) => !item.isRead).length;
          state.unreadCount += unreadDeletedCount;
          state.pagination.total += deletedItems.length;
          state._rollbackBulkDeletedItems = null;
        }
        state.error = action.payload ?? "An error occurred";
      });
  },
});

export const {
  addLiveNotification,
  resetNotifications,
  setSocketStatus,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;