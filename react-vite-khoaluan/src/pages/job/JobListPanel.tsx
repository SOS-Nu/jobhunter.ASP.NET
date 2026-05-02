// components/client/JobListPanel.tsx (Hoặc tên file tương tự)

import React from "react";
import { IJob } from "@/types/backend";
import JobCard from "@/components/client/card/job.card";

interface IProps {
  jobList: IJob[] | null;
  isLoading: boolean;
  showPagination?: boolean; // Prop này vẫn giữ nguyên
  showButtonAllJob: boolean;
}

const JobListPanel = (props: IProps) => {
  const { jobList, isLoading, showPagination, showButtonAllJob } = props;

  return (
    <div className="left-panel-container">
      <div className="left-panel-body">
        <JobCard
          jobs={jobList}
          isLoading={isLoading}
          isListPage={true}
          showPagination={showPagination}
          showButtonAllJob={showButtonAllJob}
        />
      </div>
    </div>
  );
};

export default React.memo(JobListPanel);
