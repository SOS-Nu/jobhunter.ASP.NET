// src/components/company/JobListByCompany.tsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IJob, IModelPaginate } from "@/types/backend";
import { callFetchJobsByCompany } from "@/config/api";
import JobCard from "@/components/client/card/job.card"; // Component JobCard bạn đã có
import { Pagination, Empty } from "antd";
import "styles/panel-detail.scss";

interface IProps {
  companyId: string;
}

const JobListByCompany = ({ companyId }: IProps) => {
  const [jobList, setJobList] = useState<IJob[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [meta, setMeta] = useState<IModelPaginate<IJob>["meta"] | null>(null);

  // Dùng searchParams để quản lý việc phân trang cho danh sách job
  const [jobSearchParams, setJobSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      const page = jobSearchParams.get("job_page") || "1";
      const size = jobSearchParams.get("job_size") || "5"; // Hiển thị 5 jobs mỗi trang
      const query = `page=${page}&size=${size}&sort=updatedAt,desc`;

      const res = await callFetchJobsByCompany(companyId, query);

      if (res?.data) {
        setJobList(res.data.result);
        setMeta(res.data.meta);
      }
      setIsLoading(false);
    };

    fetchJobs();
  }, [companyId, jobSearchParams]);

  const handleOnchangePage = (page: number, pageSize: number) => {
    // Cập nhật URL để chuyển trang, chỉ thay đổi param của job list
    setJobSearchParams(
      (prev) => {
        prev.set("job_page", page.toString());
        prev.set("job_size", pageSize.toString());
        return prev;
      },
      { replace: true }
    );
  };

  return (
    <div className="job-list-by-company-container">
      <JobCard
        jobs={jobList}
        isLoading={isLoading}
        title="Việc làm đang tuyển"
        isListPage={true}
        showButtonAllJob={true} // Ẩn nút "Xem tất cả"
        openInNewTab={true} // <<< TRUYỀN PROP NÀY
      />

      {!isLoading && (!jobList || jobList.length === 0) && (
        <div
          style={{
            marginTop: "20px",
            background: "var(--background-body-tertiary)",
            borderRadius: "8px",
          }}
          className="empty-detail-placeholder"
        >
          <Empty
            className="empty-detail-placeholder-text"
            description="Công ty chưa có tin tuyển dụng."
          />
        </div>
      )}

      {meta && meta.total > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px 0",
          }}
        >
          <Pagination
            current={meta.page}
            total={meta.total}
            pageSize={meta.pageSize}
            onChange={handleOnchangePage}
            responsive
            size="default"
          />
        </div>
      )}
    </div>
  );
};

export default JobListByCompany;
