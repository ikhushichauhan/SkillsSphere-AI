import { jest } from "@jest/globals";
import * as jobController from "../controller.js";
import * as jobService from "../service.js";

// Mock the service layer so we only test controller logic
jest.mock("../service.js");

describe("Job Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "user123" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("createJobPosting", () => {
    it("should respond with 201 and created job", async () => {
      req.body = { title: "Test Job", skills: ["JS"] };
      
      const mockCreatedJob = { _id: "job123", ...req.body, recruiter: req.user._id };
      jobService.createJob.mockResolvedValue(mockCreatedJob);

      await jobController.createJobPosting(req, res, next);

      expect(jobService.createJob).toHaveBeenCalledWith(req.body, req.user._id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        job: mockCreatedJob
      });
    });

    it("should pass errors to next()", async () => {
      const error = new Error("Database error");
      jobService.createJob.mockRejectedValue(error);

      await jobController.createJobPosting(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateJobPosting", () => {
    it("should respond with 200 and updated job", async () => {
      req.params.id = "job123";
      req.body = { title: "Updated Job" };
      
      const mockUpdatedJob = { _id: "job123", ...req.body };
      // Note: controller expects updateJob in service to be exported as updateJob
      jobService.updateJob.mockResolvedValue(mockUpdatedJob);

      await jobController.updateJobPosting(req, res, next);

      expect(jobService.updateJob).toHaveBeenCalledWith("job123", req.body, "user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        job: mockUpdatedJob
      });
    });
  });

  describe("deleteJobPosting", () => {
    it("should respond with 200 on successful deletion", async () => {
      req.params.id = "job123";
      
      jobService.deleteJob.mockResolvedValue();

      await jobController.deleteJobPosting(req, res, next);

      expect(jobService.deleteJob).toHaveBeenCalledWith("job123", "user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Job deleted successfully"
      });
    });
  });
});
