export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
}

export interface IModelPaginate<T> {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
    hasMore?: boolean;
  };
  result: T[];
}

export interface IAccount {
  access_token: string;
  user: {
    id: string | number;
    email: string;
    name: string;
    age?: number;
    gender?: string;
    address?: string | null;
    avatar?: string | null;
    mainResume?: string | null;
    onlineResume?: IOnlineResume | null;
    workExperiences?: IWorkExperience[];
    public?: boolean;
    vipExpiryDate: string | null;

    role: {
      id: string | number;
      name: string;
      description?: string;
      active: boolean;
      createdAt?: string;
      updatedAt?: string | null;
      createdBy?: string;
      updatedBy?: string | null;
      permissions: {
        id: string | number;
        name: string;
        apiPath: string;
        method: string;
        module: string;
        createdAt?: string;
        updatedAt?: string | null;
        createdBy?: string;
        updatedBy?: string | null;
      }[];
    };
    company: {
      id?: string | number;
      name?: string;
      logo?: string;
    } | null;
    vip: boolean;
  };
}

export interface ICandidate {
  score: number;
  user: IUser; // Dùng lại interface IUser đã có
}
export interface IGetAccount extends Omit<IAccount, "access_token"> {}

export interface ICompany {
  id?: string;
  name?: string;
  address?: string;
  logo?: string | null | undefined;
  description?: string;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  field?: string;
  website?: string;
  scale?: string;
  country?: string;
  foundingYear?: number;
  location?: string;
  updatedBy?: string | null;
  totalJobs?: number;
  hrCompany?: hrCompany;
  averageRating?: number;
  totalComments?: number;
  comment?: boolean;
}

export interface hrCompany {
  id?: number;
  name?: string;
  email?: string;
}

export interface ISkill {
  id?: string;
  name?: string;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser {
  id?: number | undefined;
  name?: string | undefined;
  email?: string | null;
  password?: string;
  age?: number;
  gender?: string;
  address?: string | null;
  avatar?: string | null;
  mainResume?: string | null;
  onlineResume?: IOnlineResume | null;
  workExperiences?: IWorkExperience[];
  public?: boolean;
  vipExpiryDate?: string | null | undefined;
  vip?: boolean | null;
  role?: {
    id: string;
    name: string;
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

interface IResponseImport {
  total: number;
  success: number;
  failed: number;
  failedEmails?: any;
}

export interface IJob {
  id?: string;
  name: string;
  skills: ISkill[];
  company?: {
    id: string;
    name: string;
    logo?: string;
    address?: string;
    scale?: string;
    foundingYear?: number;
  };
  location: string;
  applied: boolean;

  address: string;
  salary: number;
  quantity: number;
  level: string;
  description: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IJobWithScore {
  score: number;
  job: IJob;
}

export type IMeta = IModelPaginate<any>["meta"];

export interface IResume {
  id?: string;
  email: string;
  userId?: string;
  url: string;
  status: string;
  companyName?: string;
  score?: number;
  coverLetter?: string;

  job?: {
    id: string;
    name: string;
  };
  companyId:
    | string
    | {
        id: string;
        name: string;
        logo: string;
      };
  jobId:
    | string
    | {
        id: string;
        name: string;
      };
  user?: { id: number; name: string };
  history?: {
    status: string;
    updatedAt: Date;
    updatedBy: { id: string; email: string };
  }[];
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPermission {
  id?: string;
  name?: string;
  apiPath?: string;
  method?: string;
  module?: string;

  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRole {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  permissions: IPermission[] | string[];

  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISubscribers {
  id?: string;
  name?: string;
  email?: string;
  skills: string[];
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDashboardData {
  totalUsers: number;
  totalCompanies: number;
  totalJobs: number;
  totalResumesApproved: number; // Thêm key mới
}

export interface ICommentUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface IComment {
  id: number;
  comment: string;
  rating: number;
  user: ICommentUser;
  createdAt: string;
  createdBy: string;
}

export interface IWorkExperience {
  id?: number;
  companyName: string;
  startDate: string;
  endDate: string;
  description: string;
  location: string;
  // Thêm các trường khác nếu cần
  createdAt?: string;
  updatedAt?: string;
}

export interface IOnlineResume {
  id?: number;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  summary: string;
  certifications: string;
  educations: string;
  languages: string;
  skills: { id: number; name?: string }[];
  workExperiences?: IWorkExperience[]; // có thể thêm sau này
  user?: {
    id: number;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UserInfo {
  id: number;
  email: string;
  name: string;
  avatar: string;
  role: { id: number };
  company?: {
    id: number;
    name: string;
    logoUrl: string;
    city: string;
  };
  status?: "ONLINE" | "OFFLINE";
  lastMessage?: LastMessage; // Thêm thuộc tính này
}

interface LastMessage {
  content: string;
  senderId: number;
  timestamp: string; // Hoặc Date
}

//ai evualation
// (Interfaces: IEvaluationResult, etc. không thay đổi)
interface IImprovementSuggestion {
  area: string;
  suggestion: string;
}

interface IRoadmapStep {
  step: number;
  action: string;
  reason: string;
}

interface ISuggestedJob {
  jobTitle: string;
  companyName: string;
  matchReason: string;
  jobId: number;
}

interface IEvaluationResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: IImprovementSuggestion[];
  estimatedSalaryRange: string;
  suggestedRoadmap: IRoadmapStep[];
  relevantJobs: ISuggestedJob[];
}

export interface IReqLoginOtp {
  email: string;
  otpCode: string;
  password: string;
}

export interface IPaymentHistory {
  id: number;
  amount: number;
  userEmail: string;
  orderId: string;
  responseCode: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

//#region interview
// Định nghĩa cấu trúc cho câu hỏi từ AI
export interface IInterviewQuestion {
  question: string;
  category: string;
  targetedSkill: string;
  hint: string;
}

export interface IInterviewQuestionsResponse {
  questions: IInterviewQuestion[];
}

// Định nghĩa cấu trúc cho dữ liệu gửi lên chấm điểm
export interface IInterviewAnswer {
  question: string;
  answer: string;
}

export interface IEvaluateInterviewRequest {
  jobId: string | undefined;
  answers: IInterviewAnswer[];
}

// Định nghĩa cấu trúc cho kết quả chấm điểm trả về
export interface IFeedbackDetail {
  question: string;
  score: number;
  strengths: string;
  improvements: string;
  modelAnswer: string;
}

export interface IInterviewFeedbackResponse {
  overallScore: number;
  generalComment: string;
  details: IFeedbackDetail[];
}

//#endregion
