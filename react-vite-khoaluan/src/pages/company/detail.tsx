// src/pages/company/detail.tsx

import { useSearchParams } from "react-router-dom";
import { Col, Row, Empty } from "antd";

// Đừng quên import file css chính
import "styles/panel-detail.scss";
import JobListByCompany from "./JobListByCompany";
import CompanyDetailPanel from "./CompanyDetailPanel";

const ClientCompanyDetailPage = () => {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("id");

  if (!companyId) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty description="URL không hợp lệ. Vui lòng chọn một công ty để xem chi tiết." />
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: 20 }}>
      <Row gutter={[30, 30]}>
        {/* Cột Trái: Danh sách Jobs */}
        <Col span={24} lg={9}>
          <JobListByCompany companyId={companyId} />
        </Col>

        {/* Cột Phải: Chi tiết Công ty (Sticky) */}
        <Col span={24} lg={15}>
          <CompanyDetailPanel companyId={companyId} />
        </Col>
      </Row>
    </div>
  );
};

export default ClientCompanyDetailPage;
