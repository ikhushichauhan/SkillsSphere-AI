import { jest } from "@jest/globals";
import * as jobService from "../service.js";
import JobPosting from "../../../database/models/JobPosting.js";
import JobApplication from "../../../database/models/JobApplication.js";
import AppError from "../../../utils/AppError.js";

// Mock the models
jest.mock("../../../database/models/JobPosting.js");
jest.mock("../../../database/models/JobApplication.js");
jest.mock("../../resumes/service.js");
jest.mock("../../matching/service.js");

describe("Job Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createJob", () => {
    it("should successfully create a job posting", async () => {
      const mockJobData = { title: "Software Engineer", skills: ["React", "Node"] };
      const mockRecruiterId = "recruiter123";
      
      const mockCreatedJob = { ...mockJobData, recruiter: mockRecruiterId, _id: "job123" };
      JobPosting.create = jest.fn().mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(mockJobData, mockRecruiterId);

      expect(JobPosting.create).toHaveBeenCalledWith({
        ...mockJobData,
        recruiter: mockRecruiterId,
      });
      expect(result).toEqual(mockCreatedJob);
    });
  });

  describe("updateJob", () => {
    it("should update a job successfully when user is the owner", async () => {
      const mockJobId = "job123";
      const mockRecruiterId = "recruiter123";
      const mockUpdateData = { title: "Senior Software Engineer" };

      const mockExistingJob = { _id: mockJobId, recruiter: { toString: () => mockRecruiterId } };
      const mockUpdatedJob = { ...mockExistingJob, ...mockUpdateData };

      JobPosting.findById = jest.fn().mockResolvedValue(mockExistingJob);
      JobPosting.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedJob);

      const result = await jobService.updateJob(mockJobId, mockUpdateData, mockRecruiterId);

      expect(JobPosting.findById).toHaveBeenCalledWith(mockJobId);
      expect(JobPosting.findByIdAndUpdate).toHaveBeenCalledWith(
        mockJobId,
        mockUpdateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockUpdatedJob);
    });

    it("should throw AppError(404) if job not found", async () => {
      JobPosting.findById = jest.fn().mockResolvedValue(null);

      await expect(jobService.updateJob("invalidId", {}, "recruiter123")).rejects.toThrow(AppError);
      await expect(jobService.updateJob("invalidId", {}, "recruiter123")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw AppError(403) if recruiter is not the owner", async () => {
      const mockExistingJob = { _id: "job123", recruiter: { toString: () => "differentRecruiter" } };
      JobPosting.findById = jest.fn().mockResolvedValue(mockExistingJob);

      await expect(jobService.updateJob("job123", {}, "recruiter123")).rejects.toThrow(AppError);
      await expect(jobService.updateJob("job123", {}, "recruiter123")).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("deleteJob", () => {
    it("should delete a job and its applications when user is owner", async () => {
      const mockJobId = "job123";
      const mockRecruiterId = "recruiter123";

      const mockExistingJob = { _id: mockJobId, recruiter: { toString: () => mockRecruiterId } };
      
      JobPosting.findById = jest.fn().mockResolvedValue(mockExistingJob);
      JobApplication.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
      JobPosting.findByIdAndDelete = jest.fn().mockResolvedValue(mockExistingJob);

      await jobService.deleteJob(mockJobId, mockRecruiterId);

      expect(JobPosting.findById).toHaveBeenCalledWith(mockJobId);
      expect(JobApplication.deleteMany).toHaveBeenCalledWith({ job: mockJobId });
      expect(JobPosting.findByIdAndDelete).toHaveBeenCalledWith(mockJobId);
    });
  });
});
