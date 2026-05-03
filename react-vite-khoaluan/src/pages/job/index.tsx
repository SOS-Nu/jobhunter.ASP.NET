import JobCard from "@/components/client/card/job.card";
import ApplyModal from "@/components/client/modal/apply.modal";
import SearchClient from "@/components/client/search.client";
import { callFetchJobById } from "@/config/api";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchJob,
  fetchJobsAI,
} from "@/redux/slice/jobSlide";
import { IJob, IUser } from "@/types/backend";
import { Pagination } from "antd";
import bg from "assets/top-bg.svg";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import JobDetailPanel from "./JobDetailPanel";
import JobFilter from "./JobFilter";

dayjs.extend(relativeTime);

const ClientJobPage = () => {
  const [jobDetail, setJobDetail] = useState<IJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentSearchType, setCurrentSearchType] = useState<string>("job");

  const jobListRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    result: regularJobList,
    aiResult: aiJobList,
    isFetching: isLoadingList,
    meta,
    isAiSearch,
  } = useAppSelector((state) => state.job);

  const user = useAppSelector((state) => state.account.user) as IUser;

  const prevListQueryKey = useRef<string>(null);
  const prevId = useRef<string | null>(null);
  // >> THÊM DÒNG NÀY: Kiểm tra màn hình mobile
  // 991.98px là breakpoint lg của Bootstrap 5
  const isMobile = useMediaQuery("(max-width: 991.98px)");

  useEffect(() => {
    const listQuery = new URLSearchParams(searchParams);
    listQuery.delete("id");
    const currentListQueryKey = listQuery.toString();
    const currentId = searchParams.get("id");

    const searchTypeFromUrl = searchParams.get("search_type");
    if (searchTypeFromUrl === "ai") {
      setCurrentSearchType("ai");
    } else {
      if (location.pathname.startsWith("/company")) {
        setCurrentSearchType("company");
      } else {
        setCurrentSearchType("job");
      }
    }

    if (
      currentListQueryKey !== prevListQueryKey.current ||
      location.state?.file
    ) {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const size = parseInt(searchParams.get("pageSize") || "10", 10);

      if (searchTypeFromUrl === "ai") {
        const prompt = searchParams.get("prompt");
        const queryParams = new URLSearchParams(searchParams);
        queryParams.delete("id");
        queryParams.delete("search_type");
        queryParams.delete("prompt");

        // Luôn gọi AI fetch cho mỗi trang/filter thay vì 2 bước
        if (prompt || location.state?.file) {
          const formData = new FormData();
          formData.append("skillsDescription", prompt || "Phù hợp với CV");

          if (location.state?.file) {
            formData.append("file", location.state.file);
            navigate(location.pathname + location.search, {
              replace: true,
              state: {},
            });
          }
          dispatch(fetchJobsAI({ formData, query: queryParams.toString() }));
        }
      } else {
        const queryParams = new URLSearchParams(searchParams);
        queryParams.delete("id");
        queryParams.delete("search_type");
        dispatch(fetchJob({ query: queryParams.toString(), user }));
      }
    }

    if (currentId !== prevId.current) {
      if (currentId) {
        callFetchJobById(currentId).then((res) =>
          setJobDetail(res?.data?.data ?? null)
        );
      } else {
        setJobDetail(null);
      }
    }

    prevListQueryKey.current = currentListQueryKey;
    prevId.current = currentId;
  }, [searchParams, dispatch, location, navigate, user]);

  const handleOnchangePage = (page: number, pageSize: number) => {
    setSearchParams((prev) => {
      prev.set("page", page.toString());
      prev.set("pageSize", pageSize.toString());
      return prev;
    });
    if (jobListRef.current) {
      const yOffset = -50;
      const elementPosition = jobListRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY + yOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // ===================================================================
  // >>> SỬA LỖI TẠI ĐÂY: KHÔI PHỤC LẠI LOGIC CHO handleFilter <<<
  // ===================================================================
  const handleFilter = async ({
    levels,
    salary,
    sortSalary,
    sortTime, // Thêm tham số sortTime
  }: {
    levels: string[];
    salary: { min: string; max: string };
    sortSalary: string;
    sortTime: string;
  }) => {
    const currentFilter = searchParams.get("filters") || "";

    const filterParts: string[] = [];

    // Tên và địa điểm từ thanh tìm kiếm
    const baseNamePart = currentFilter.match(/name@=[^,|]+/);
    const baseLocationPart = currentFilter.match(/location@=[^,|]+/);
    if (baseNamePart) filterParts.push(baseNamePart[0]);
    if (baseLocationPart) filterParts.push(baseLocationPart[0]);

    // Thêm filter lương
    if (salary.min) filterParts.push(`salary>=${salary.min}`);
    if (salary.max) filterParts.push(`salary<=${salary.max}`);

    if (levels.length > 0) {
      filterParts.push(levels.map((l) => `level==${l}`).join("|"));
    }

    setSearchParams((prev) => {
      const resultStr = filterParts.join(",");

      if (resultStr) {
        prev.set("filters", resultStr);
      } else {
        prev.delete("filters");
      }

      // >>> LOGIC MỚI: Ưu tiên sort lương, nếu không thì dùng sort thời gian <<<
      if (sortSalary) {
        // Nếu có chọn sắp xếp lương
        prev.set("sorts", sortSalary === "asc" ? "salary" : "-salary");
      } else {
        // Nếu không, dùng sắp xếp thời gian (mặc định là mới nhất)
        prev.set(
          "sorts",
          sortTime === "oldest" ? "updatedAt" : "-updatedAt"
        );
      }

      prev.set("page", "1"); // Reset về trang 1
      return prev;
    });
  };

  const finalJobList = isAiSearch
    ? (aiJobList || []).map((item) => ({ ...item.job, _score: item.score }))
    : regularJobList || [];

  const paginationTotal = () => {
    return meta.total;
  };

  const shouldShowPagination =
    !isLoadingList && finalJobList.length > 0 && meta.total > 0;

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${bg})`,
          width: "100%",
          height: 500,
          position: "absolute",
          top: 50,
          backgroundRepeat: "repeat",
          zIndex: -100,
        }}
      ></div>
      <div className="container job-detail-page-container">
        <SearchClient
          searchType={currentSearchType}
          onSearchTypeChange={setCurrentSearchType}
        />

        {/* Điều kiện này đã được sửa lại cho đúng ở các bước trước */}
        {(currentSearchType === "job" || currentSearchType === "company") &&
          searchParams.has("filters") && <JobFilter onFilter={handleFilter} />}

        <div className="row g-3" ref={jobListRef}>
          <div className={isMobile ? "col-12" : "col-4"}>
            <JobCard
              jobs={finalJobList}
              isLoading={isLoadingList}
              isListPage={true}
              showButtonAllJob={true}
              openInNewTab={isMobile}
            />
          </div>
          {!isMobile && (
            <div className="col-8 ">
              <JobDetailPanel />
            </div>
          )}
        </div>

        {shouldShowPagination && (
          <div className="bottom-pagination-container">
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

        <ApplyModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          jobDetail={jobDetail}
        />
      </div>
    </>
  );
};

export default ClientJobPage;
