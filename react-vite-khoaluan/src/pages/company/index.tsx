import { Col, Row, Divider, Pagination } from "antd";
import styles from "styles/client.module.scss";
import CompanyCard from "@/components/client/card/company.card";
import SearchClient from "@/components/client/search.client"; // Thêm SearchClient
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clearCompanies, fetchCompany } from "@/redux/slice/companySlide"; // Import action fetchCompany
import bg from "assets/top-bg.svg";

const ClientCompanyPage = () => {
  // Sử dụng Redux và Router hooks
  const dispatch = useAppDispatch();
  const { result, isFetching, meta } = useAppSelector((state) => state.company);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialLoad = useRef(true);
  const [currentSearchType, setCurrentSearchType] = useState("job");
  const companyListRef = useRef<HTMLDivElement>(null);

  // useEffect để fetch dữ liệu khi URL thay đổi
  useEffect(() => {
    const query = searchParams.toString();

    // BƯỚC 3: Áp dụng logic mới
    // Trường hợp 1: Lần đầu tiên component được tải (truy cập mới hoặc refresh)
    if (isInitialLoad.current) {
      isInitialLoad.current = false; // Đánh dấu không còn là lần đầu nữa
      // Luôn fetch dữ liệu: hoặc theo query trên URL (nếu có), hoặc fetch mặc định
      dispatch(fetchCompany({ query: query || "sort=updatedAt,desc&size=6" }));
    } else {
      // Trường hợp 2: Component re-render do URL thay đổi
      if (query) {
        // Nếu có query mới -> là một lần tìm kiếm mới
        dispatch(fetchCompany({ query }));
      } else {
        // Nếu query rỗng -> người dùng vừa xóa tìm kiếm
        // -> Chỉ xóa kết quả cũ, không fetch mặc định
        dispatch(clearCompanies());
      }
    }
  }, [searchParams, dispatch]);

  // Hàm xử lý chuyển trang
  const handleOnchangePage = (page: number, pageSize: number) => {
    setSearchParams((prev) => {
      prev.set("page", page.toString());
      prev.set("size", pageSize.toString());
      return prev;
    });

    // Thêm hành động cuộn trang
    if (companyListRef.current) {
      const yOffset = -100; // Khoảng đệm 10px phía trên
      const elementPosition =
        companyListRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY + yOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

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
          zIndex: 0,
        }}
      ></div>
      <div className={styles["container"]} style={{ marginTop: 20 }}>
        <Row gutter={[20, 20]}>
          {/* Thêm thanh tìm kiếm vào trang company */}
          <Col span={24}>
            <SearchClient
              searchType={currentSearchType}
              onSearchTypeChange={setCurrentSearchType}
            />
          </Col>
          <Divider />

          <Col span={24}>
            {/* Truyền dữ liệu từ Redux store xuống CompanyCard */}
            <CompanyCard
              companies={result}
              isLoading={isFetching}
              title="Danh sách công ty"
              showPagination={true}
              companyListRef={companyListRef}
            />
          </Col>

          {/* Quản lý Pagination ở trang cha */}
          <Col
            span={24}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            {!isFetching && meta.total > 0 && (
              <Pagination
                current={meta.page}
                total={meta.total}
                pageSize={meta.pageSize}
                onChange={handleOnchangePage}
                responsive
                showSizeChanger
              />
            )}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ClientCompanyPage;
