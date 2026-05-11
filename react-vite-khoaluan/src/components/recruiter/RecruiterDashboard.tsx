// src/components/recruiter/RecruiterDashboard.tsx

import { useRef, useState } from "react";
// >>> BƯỚC 1: Đổi import từ 'react-bootstrap' sang 'antd' <<<
import { useAppSelector } from "@/redux/hooks";
import { Pagination } from "antd";
import { Spinner, Tab, Tabs } from "react-bootstrap";
import { toast } from "react-toastify";

import { callFindCandidatesWithAI } from "@/config/api";
import { ICandidate, IMeta } from "@/types/backend";
import CandidateResults from "./CandidateResults";
import CandidateSearchForm from "./CandidateSearchForm";
import CompanyForm from "./CompanyForm";
import SkillSearchTab from "./SkillSearchTab";

const RecruiterDashboard = () => {
  const user = useAppSelector((state) => state.account.user);
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<ICandidate[]>([]);
  const [currentSearchData, setCurrentSearchData] = useState<FormData | null>(null);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // >>> BƯỚC 2: TẠO HÀM TÍNH TỔNG KẾT QUẢ CHO PAGINATION <<<
  // Logic này sẽ thêm 1 trang ảo nếu backend báo vẫn còn kết quả (hasMore: true)
  const paginationTotal = () => {
    return meta?.total || 0;
  };

  // >>> BƯỚC 3: CẬP NHẬT HÀM XỬ LÝ PHÂN TRANG THEO CHUẨN CỦA ANTD <<<
  // antd trả về (page, pageSize) trong hàm onChange
  const handleOnchangePage = async (page: number, pageSize: number) => {
    if (!currentSearchData) return;

    setIsSearching(true);
    if (resultsRef.current) {
      const yOffset = -100;
      const elementPosition = resultsRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY + yOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    try {
      const query = `page=${page}&pageSize=${pageSize}`;
      const res = await callFindCandidatesWithAI(currentSearchData, query);

      if (res.data) {
        setCandidates(res.data.result || []);
        setMeta(res.data.meta);
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tải trang mới.");
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = (formData: FormData) => {
    setCandidates([]);
    setCurrentSearchData(formData);
    setMeta(null);
  };

  return (
    <Tabs defaultActiveKey="find-candidates" className="mb-3">
      <Tab eventKey="company-info" title="Thông tin công ty">
        <CompanyForm initialData={user.company} />
      </Tab>

      <Tab eventKey="find-candidates" title="Tìm kiếm ứng viên (AI)">
        <CandidateSearchForm
          setIsSearching={setIsSearching}
          setCandidates={setCandidates}
          setMeta={setMeta}
          onNewSearch={resetSearch}
        />

        <div ref={resultsRef}>
          {isSearching && (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">
                AI đang phân tích, vui lòng chờ trong giây lát...
              </p>
            </div>
          )}

          {!isSearching && candidates.length > 0 && (
            <>
              <CandidateResults candidates={candidates} />

              {/* >>> BƯỚC 4: THAY THẾ COMPONENT PAGINATION CỦA BOOTSTRAP BẰNG ANTD <<< */}
              {meta && meta.total > 0 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    size="default"
                    current={meta.page}
                    total={paginationTotal()}
                    pageSize={meta.pageSize}
                    onChange={handleOnchangePage}
                    responsive
                    showSizeChanger
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Tab>

      <Tab eventKey="search-by-skills" title="Tìm kiếm theo Skill">
        <SkillSearchTab />
      </Tab>

      {/* <Tab eventKey="manage-jobs" title="Quản lý tin tuyển dụng" disabled>
      </Tab> */}
    </Tabs>
  );
};

export default RecruiterDashboard;
