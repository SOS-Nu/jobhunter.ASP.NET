import {
  IAccount,
  IBackendRes,
  ICandidate,
  IComment,
  ICompany,
  IDashboardData,
  IEvaluateInterviewRequest,
  IGetAccount,
  IInterviewFeedbackResponse,
  IInterviewQuestionsResponse,
  IJob,
  IJobWithScore,
  IMeta,
  IModelPaginate,
  IOnlineResume,
  IPaymentHistory,
  IPermission,
  IReqLoginOtp,
  IResponseImport,
  IResume,
  IRole,
  ISkill,
  ISubscribers,
  IUser,
  IWorkExperience,
} from "@/types/backend";
import axios from "config/axios-customize";

/**
 * 
Module Auth
 */
export const callRegister = (
  name: string,
  email: string,
  password: string,
  age: number,
  gender: string,
  address: string,
  otpCode: string, // Thêm tham số otpCode
) => {
  return axios.post<IBackendRes<IUser>>("/api/v1/auth/register", {
    name,
    email,
    password,
    age,
    gender,
    address,
    otpCode, // Gửi kèm otpCode
  });
};

/**
 * Gửi mã OTP đến email người dùng
 */
export const callSendOtp = (email: string) => {
  return axios.post("/api/v1/auth/register/send-otp", { email });
};

// Ví dụ: trong file .../config/api.ts
export const callLogin = (username: string, password: string) => {
  return axios.post<IBackendRes<IAccount>>(
    "/api/v1/auth/login",
    {
      username,
      password,
    },
    {
      // BẢO AXIOS KHÔNG NÉM LỖI VỚI STATUS 4xx
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Chấp nhận 200 -> 499
      },
    },
  );
};
export const callSendLoginOtp = (email: string) => {
  return axios.post<IBackendRes<any>>(
    "/api/v1/auth/login-otp/send",
    {
      email,
    },
    {
      validateStatus: (status) => status >= 200 && status < 500,
    },
  );
};

// 2. API Xác thực OTP và Đăng nhập (đá session)
export const callVerifyLoginOtp = (data: IReqLoginOtp) => {
  // res.data sẽ là IAccount (giống hệt callLogin)
  return axios.post<IBackendRes<IAccount>>(
    "/api/v1/auth/login-otp/verify",
    data,
    {
      validateStatus: (status) => status >= 200 && status < 500,
    },
  );
};

export const callFetchAccount = () => {
  return axios.get<IBackendRes<IGetAccount>>("/api/v1/auth/account");
};

export const callRefreshToken = () => {
  return axios.get<IBackendRes<IAccount>>("/api/v1/auth/refresh");
};

export const callLogout = () => {
  return axios.post<IBackendRes<string>>("/api/v1/auth/logout");
};

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: any, folderType: string) => {
  const bodyFormData = new FormData();
  bodyFormData.append("file", file);
  bodyFormData.append("folder", folderType);

  return axios<IBackendRes<{ fileName: string }>>({
    method: "post",
    url: "/api/v1/files",
    data: bodyFormData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * 
Module Company
 */
export const callCreateCompany = (
  name: string,
  address: string,
  description: string,
  logo: string,
  // >> Thêm các tham số mới vào đây
  field: string,
  website: string,
  scale: string,
  country: string,
  foundingYear: number,
  location: string,
) => {
  return axios.post("/api/v1/companies", {
    name,
    address,
    description,
    logo,
    // >> Đưa các trường mới vào body của request
    field,
    website,
    scale,
    country,
    foundingYear,
    location,
  });
};

export const callUpdateCompany = (
  id: string,
  name: string,
  address: string,
  description: string,
  logo: string,
  field: string,
  website: string,
  scale: string,
  country: string,
  foundingYear: number,
  location: string,
) => {
  return axios.put<IBackendRes<ICompany>>(`/api/v1/companies`, {
    id,
    name,
    address,
    description,
    logo,
    field,
    website,
    scale,
    country,
    foundingYear,
    location,
  });
};

export const callDeleteCompany = (id: string) => {
  return axios.delete<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
};

export const callFetchCompany = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<ICompany>>>(
    `/api/v1/companies?${query}`,
  );
};

export const callFetchCompanyById = (id: string) => {
  return axios.get<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
};

export const callFetchJobsByCompany = (id: string, query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IJob>>>(
    `/api/v1/jobs/by-company/${id}?${query}`,
  );
};

export const callCreateComment = (data: {
  comment: string;
  rating: number;
  companyId: number;
}) => {
  return axios.post("/api/v1/comments", data);
};

export const callUpdateComment = (data: {
  id: number;
  comment: string;
  rating: number;
}) => {
  return axios.post("/api/v1/comments/update", data);
};

export const callFetchCommentsByCompany = (id: string, query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IComment>>>(
    `/api/v1/comments/by-company/${id}?${query}`,
  );
};

/**
 * 
Module Skill
 */
export const callCreateSkill = (name: string) => {
  return axios.post<IBackendRes<ISkill>>("/api/v1/skills", { name });
};

export const callBulkCreateSkillAPI = (
  importSkill: {
    name: string;
  }[],
) => {
  const urlBackend = "/api/v1/skills/bulk-create";
  return axios.post<IBackendRes<IResponseImport>>(urlBackend, importSkill);
};

export const callUpdateSkill = (id: string, name: string) => {
  return axios.put<IBackendRes<ISkill>>(`/api/v1/skills`, { id, name });
};

export const callDeleteSkill = (id: string) => {
  return axios.delete<IBackendRes<ISkill>>(`/api/v1/skills/${id}`);
};

export const callFetchAllSkill = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<ISkill>>>(
    `/api/v1/skills?${query}`,
  );
};

/**
 * 
Module User
 */
export const callCreateUser = (user: IUser) => {
  return axios.post<IBackendRes<IUser>>("/api/v1/users", { ...user });
};
// {
//     fullName: string;
//     password: string;
//     email: string;
//     phone: string;
// }
export const callBulkCreateUserAPI = (
  hoidanit: {
    name: string;
    email: string;
    password: string;
    gender: string;
    address: string;
    age: number;
    role?: { id?: number };
  }[],
) => {
  const urlBackend = "/api/v1/users/bulk-create";
  console.log("res", hoidanit);

  return axios.post<IBackendRes<IResponseImport>>(urlBackend, hoidanit);
};

export const callUpdateUser = (user: IUser) => {
  return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user });
};

export const callDeleteUser = (id: number) => {
  return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
};

export const callFetchUser = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IUser>>>(
    `/api/v1/users?${query}`,
  );
};

/**
 * 
Module Job
 */
export const callCreateJob = (job: IJob) => {
  return axios.post<IBackendRes<IJob>>("/api/v1/jobs", { ...job });
};

export const callCreateJobForCompany = (job: IJob) => {
  return axios.post<IBackendRes<IJob>>("/api/v1/jobs/by-user-company", {
    ...job,
  });
};

export const callBulkCreateJobAPI = (
  importJob: {
    name: string;
    location: string;
    salary: string;
    company: { id: number };
    quantity: number;
    level: string;
    description: string;
    startDate: string;
    endDate: string;
    active: boolean;
    skills: {
      id: number;
    }[];
  }[],
) => {
  const urlBackend = "/api/v1/jobs/bulk-create";
  console.log("res", importJob);

  return axios.post<IBackendRes<IResponseImport>>(urlBackend, importJob);
};

export const callUpdateJob = (job: IJob, id: string) => {
  return axios.put<IBackendRes<IJob>>(`/api/v1/jobs`, { id, ...job });
};

export const callUpdateJobForCompany = (job: IJob, id: string) => {
  return axios.put<IBackendRes<IJob>>(`/api/v1/jobs/by-user-company`, {
    id,
    ...job,
  });
};

export const callDeleteJob = (id: string) => {
  return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
};

export const callDeleteJobForCompany = (id: string) => {
  return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/by-user-company/${id}`);
};

export const callFetchJob = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs?${query}`);
};

export const callFindJobsByAI = (
  formData: FormData,
  page: number,
  size: number,
) => {
  return axios<
    IBackendRes<{
      jobs: { score: number; job: IJob }[];
      meta: { page: number; pageSize: number; pages: number; total: number };
    }>
  >({
    method: "post",
    // Thêm page và size vào query params
    url: `/api/v1/gemini/find-jobs?page=${page}&pageSize=${size}`,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
// API Tìm kiếm việc làm bằng AI (Single Step)
export const callFindJobsWithAI = (
  formData: FormData,
  query: string, // Hỗ trợ filter (Spring Specification)
) => {
  return axios<IBackendRes<IModelPaginate<IJobWithScore>>>({
    method: "post",
    url: `/api/v1/gemini/jobs?${query}`,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const callFetchJobById = (id: string) => {
  return axios.get<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
};

/**
 * 
Module Resume
 */
export const callCreateResume = (
  url: string,
  jobId: any,
  email: string,
  userId: string | number,
  coverLetter: string, // Thêm tham số này
) => {
  return axios.post<IBackendRes<IResume>>(
    "/api/v1/resumes",
    {
      email,
      url,
      coverLetter, // Gửi kèm lời giới thiệu lên Backend
      status: "PENDING",
      user: {
        id: userId,
      },
      job: {
        id: jobId,
      },
    },
    {
      validateStatus: (status) => status >= 200 && status < 500,
    },
  );
};

export const callUpdateResumeStatus = (id: any, status: string) => {
  return axios.put<IBackendRes<IResume>>(`/api/v1/resumes`, { id, status });
};

export const callDeleteResume = (id: string) => {
  return axios.delete<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
};

export const callFetchResume = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IResume>>>(
    `/api/v1/resumes?${query}`,
  );
};

export const callFetchResumeById = (id: string) => {
  return axios.get<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
};

export const callFetchResumeByUser = () => {
  return axios.post<IBackendRes<IModelPaginate<IResume>>>(
    `/api/v1/resumes/by-user`,
  );
};

/**
 * 
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
  return axios.post<IBackendRes<IPermission>>("/api/v1/permissions", {
    ...permission,
  });
};

export const callUpdatePermission = (permission: IPermission, id: string) => {
  return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, {
    id,
    ...permission,
  });
};

export const callDeletePermission = (id: string) => {
  return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
};

export const callFetchPermission = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IPermission>>>(
    `/api/v1/permissions?${query}`,
  );
};

export const callFetchPermissionById = (id: string) => {
  return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
};

/**
 * 
Module Role
 */
export const callCreateRole = (role: IRole) => {
  return axios.post<IBackendRes<IRole>>("/api/v1/roles", { ...role });
};

export const callUpdateRole = (role: IRole, id: string) => {
  return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role });
};

export const callDeleteRole = (id: string) => {
  return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
};

export const callFetchRole = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IRole>>>(
    `/api/v1/roles?${query}`,
  );
};

export const callFetchRoleById = (id: string) => {
  return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
};

/**
 * 
Module Subscribers
 */
export const callCreateSubscriber = (subs: ISubscribers) => {
  return axios.post<IBackendRes<ISubscribers>>("/api/v1/subscribers", {
    ...subs,
  });
};

export const callGetSubscriberSkills = () => {
  return axios.post<IBackendRes<ISubscribers>>("/api/v1/subscribers/skills");
};

export const callUpdateSubscriber = (subs: ISubscribers) => {
  return axios.put<IBackendRes<ISubscribers>>(`/api/v1/subscribers`, {
    ...subs,
  });
};

export const callDeleteSubscriber = (id: string) => {
  return axios.delete<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
};

export const callFetchSubscriber = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<ISubscribers>>>(
    `/api/v1/subscribers?${query}`,
  );
};

export const callCreateWorkExperience = (data: IWorkExperience) => {
  return axios.post<IBackendRes<IWorkExperience>>(
    "/api/v1/work-experiences",
    data,
  );
};

export const callUpdateWorkExperience = (data: IWorkExperience) => {
  return axios.put<IBackendRes<IWorkExperience>>(
    `/api/v1/work-experiences`,
    data,
  );
};

export const callDeleteWorkExperience = (id: number) => {
  return axios.delete<IBackendRes<null>>(`/api/v1/work-experiences/${id}`);
};

/**
 *
Module Online Resume
 */
export const callCreateOnlineResume = (data: IOnlineResume) => {
  return axios.post<IBackendRes<IOnlineResume>>("/api/v1/online-resumes", data);
};

export const callUpdateOnlineResume = (data: IOnlineResume) => {
  return axios.put<IBackendRes<IOnlineResume>>("/api/v1/online-resumes", data);
};

export const callDeleteOnlineResume = (id: number) => {
  return axios.delete<IBackendRes<null>>(`/api/v1/online-resumes/${id}`);
};
export const callFetchSubscriberById = (id: string) => {
  return axios.get<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
};

export const callGetDashboard = () => {
  return axios.get<IBackendRes<IDashboardData>>("/api/v1/dashboard");
};

export const callLoginWithGoogle = (credential: string) => {
  return axios.post<IBackendRes<IAccount>>("/api/v1/auth/google", {
    credential,
  });
};

export const callFetchUserDetailById = (id: string | number) => {
  return axios.get<IBackendRes<IUser>>(`/api/v1/users/detail/${id}`);
};

export const callUploadMainResume = (file: File) => {
  const bodyFormData = new FormData();
  bodyFormData.append("file", file);
  bodyFormData.append("folder", "resumeInfor"); // folder value as specified

  return axios<IBackendRes<{ fileName: string; uploadedAt: string }>>({
    method: "post",
    url: "/api/v1/users/main-resume",
    data: bodyFormData,
    headers: {
      "Content-Type": "multipart/form-data", // Important for file uploads
    },
  });
};

export const callChangePassword = (oldPassword: string, newPassword: string) =>
  axios.post<IBackendRes<null>>("/api/v1/auth/change-password", {
    oldPassword,
    newPassword,
  });

export const callSendOtpChangePassword = (email: string) =>
  axios.post<IBackendRes<null>>("/api/v1/auth/send-otp", {
    email,
  });

export const callVerifyOtpAndChangePassword = (
  email: string,
  otpCode: string,
  newPassword: string,
) =>
  axios.post<IBackendRes<null>>("/api/v1/auth/verify-otp-change-password", {
    email,
    otpCode,
    newPassword,
  });

export const getUsersConnected = (id: number) => {
  return axios.get(`/api/v1/users-connected?id=${id}`);
};

export const getAllMessages = (senderId: number, recipientId: number) => {
  return axios.get(`/api/v1/messages/${senderId}/${recipientId}`);
};

export const callUpdateOwnInfo = (data: Partial<IUser>) => {
  return axios.put<IBackendRes<IUser>>(`/api/v1/users/update-own-info`, data);
};

export const callUpdatePublicStatus = (isPublic: boolean) => {
  return axios.put<IBackendRes<null>>(`/api/v1/users/is-public`, {
    public: isPublic,
  });
};

export const callCreateVipPaymentUrl = () => {
  // Kiểu 'any' được dùng ở đây vì response trả về có cấu trúc lồng nhau phức tạp.
  // Component sẽ tự xử lý việc truy cập vào dữ liệu cần thiết.
  return axios.post<any>("/api/v1/payment/vnpay/create");
};

export const callCreateCompanyByUser = (companyData: ICompany) => {
  return axios.post<IBackendRes<ICompany>>(
    "/api/v1/companies/by-user",
    companyData,
  );
};

export const callUpdateCompanyByUser = (companyData: ICompany) => {
  return axios.put<IBackendRes<ICompany>>(
    "/api/v1/companies/by-user",
    companyData,
  );
};

// export const callFindCandidatesByAI = (formData: FormData) => {
//   // Kiểu trả về của data là một object chứa mảng candidates
//   return axios<IBackendRes<{ candidates: ICandidate[] }>>({
//     method: "post",
//     url: "/api/v1/gemini/find-candidates",
//     data: formData,
//     headers: {
//       // Rất quan trọng để server hiểu đây là dữ liệu dạng form-data
//       "Content-Type": "multipart/form-data",
//     },
//   });
// };

// >>> THÊM 2 HÀM API MỚI CHO TÌM KIẾM ỨNG VIÊN <<<

// API Tìm kiếm ứng viên bằng AI (Single Step)
export const callFindCandidatesWithAI = (
  formData: FormData,
  query: string, // Hỗ trợ filter
) => {
  return axios<IBackendRes<IModelPaginate<ICandidate>>>({
    method: "post",
    url: `/api/v1/gemini/candidates?${query}`,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const callSearchCandidatesBySkills = (skills: string, query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IUser>>>(
    `/api/v1/users/search-by-skills?skills=${encodeURIComponent(skills)}&${query}`,
  );
};

export const callEvaluateCVWithAI = (formData: FormData) => {
  return axios.post("/api/v1/gemini/evaluate-cv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      // Axios sẽ tự động thêm 'Authorization: Bearer ...' nếu bạn đã cấu hình interceptor
    },
  });
};

export const callNotifyUserAfterApproved = (resumeId: number) => {
  return axios.post(`/api/v1/resumes/notify-user/${resumeId}`);
};

// 1. Lấy danh sách Payment (Phân trang & Filter)
export const callFetchPayment = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<IPaymentHistory>>>(
    `/api/v1/payment/allhistory?${query}`,
  );
};

// 2. Cập nhật trạng thái Payment
export const callUpdatePaymentStatus = (id: number, status: string) => {
  return axios.put<IBackendRes<IPaymentHistory>>(`/api/v1/payment/allhistory`, {
    id,
    status,
  });
};

// 3. Export Excel
export const callExportPaymentExcel = (query: string) => {
  return axios.get(`/api/v1/payment/export/excel?${query}`, {
    responseType: "blob", // Quan trọng để tải file
  });
};

// 4. Export Báo cáo Tháng (Word)
export const callExportPaymentMonthly = (month: number, year: number) => {
  return axios.get(
    `/api/v1/payment/export/monthly-report?month=${month}&year=${year}`,
    {
      responseType: "blob",
    },
  );
};

// 5. Export Báo cáo Năm (Word)
export const callExportPaymentYearly = (year: number) => {
  return axios.get(`/api/v1/payment/export/yearly-report?year=${year}`, {
    responseType: "blob",
  });
};

export const callGenerateQuestions = (
  jobId: string | undefined,
  quantity: number = 8,
  language: string = "vi",
) => {
  return axios.post<IBackendRes<IInterviewQuestionsResponse>>(
    `/api/v1/gemini/mock-interview?jobId=${jobId}&quantity=${quantity}&language=${language}`,
  );
};

export const callEvaluateInterview = (
  data: IEvaluateInterviewRequest,
  language: string = "vi",
) => {
  return axios.post<IBackendRes<IInterviewFeedbackResponse>>(
    `/api/v1/gemini/evaluate-interview?language=${language}`,
    data,
  );
};

export const callEvaluateCompany = (
  id: string | number,
  language: string = "vi",
) => {
  return axios.post(
    `/api/v1/gemini/evaluate-company/${id}?language=${language}`,
  );
};

/**
 * User Save Job API
 */
export const callSaveJob = (jobId: string | number) => {
  return axios.post(`/api/v1/user-save-jobs/${jobId}`);
};

export const callUnsaveJob = (jobId: string | number) => {
  return axios.delete(`/api/v1/user-save-jobs/${jobId}`);
};

export const callCheckJobSaved = (jobId: string | number) => {
  return axios.get<IBackendRes<boolean>>(`/api/v1/user-save-jobs/is-saved/${jobId}`);
};

export const callFetchSavedJobs = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<any>>>(`/api/v1/user-save-jobs?${query}`);
};
