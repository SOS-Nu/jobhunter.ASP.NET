import { Card, Col, Row, Statistic, Spin } from "antd";
import CountUp from "react-countup";
import { useState, useEffect } from "react";
import { callGetDashboard } from "@/config/api"; // <<< THÊM VÀO
import { IDashboardData } from "@/types/backend"; // <<< THÊM VÀO

const DashboardPage = () => {
  // <<< BẮT ĐẦU PHẦN CHỈNH SỬA >>>
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const res = await callGetDashboard();
        if (res && res.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatter = (value: number | string) => {
    return <CountUp end={Number(value)} separator="," duration={2.5} />;
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row gutter={[20, 20]}>
      <Col span={24} md={6}>
        <Card title="Tổng số Users" bordered={false}>
          <Statistic
            title="Users"
            value={dashboardData?.totalUsers ?? 0}
            formatter={formatter}
          />
        </Card>
      </Col>
      <Col span={24} md={6}>
        <Card title="Tổng số Companies" bordered={false}>
          <Statistic
            title="Companies"
            value={dashboardData?.totalCompanies ?? 0}
            formatter={formatter}
          />
        </Card>
      </Col>
      <Col span={24} md={6}>
        <Card title="Tổng số Jobs" bordered={false}>
          <Statistic
            title="Jobs"
            value={dashboardData?.totalJobs ?? 0}
            formatter={formatter}
          />
        </Card>
      </Col>
      <Col span={24} md={6}>
        <Card title="Hồ sơ đã duyệt" bordered={false}>
          <Statistic
            title="Approved Resumes"
            value={dashboardData?.totalResumesApproved ?? 0}
            formatter={formatter}
          />
        </Card>
      </Col>
    </Row>
  );
  // <<< KẾT THÚC PHẦN CHỈNH SỬA >>>
};

export default DashboardPage;
