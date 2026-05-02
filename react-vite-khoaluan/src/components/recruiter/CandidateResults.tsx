// src/components/recruiter/CandidateResults.tsx

import { ICandidate } from "@/types/backend";
import { Card, Row, Col, Badge, ProgressBar, Button } from "react-bootstrap";
import "@/styles/stylespotfolio/candicaterecruiment/candicate.resulte.scss";

interface IProps {
  candidates: ICandidate[];
}

const CandidateResults = ({ candidates }: IProps) => {
  // <<< BƯỚC 3: Tạo hàm xử lý điều hướng
  const handleViewProfile = (userId: string | number) => {
    const url = `/user/online-resumes/${userId}`;
    // Mở URL trong một tab mới
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-4">
      <h3>Kết quả tìm kiếm</h3>
      <Row xs={1} md={2} lg={3} className="g-4">
        {candidates.map(({ user, score }) => (
          <Col key={user.id} className="custom-progress-bar-wrapper">
            <Card className="h-100 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">{user.name}</h6>
                {/* <Badge bg="success">{score} điểm</Badge> */}
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <strong>Chuyên môn: </strong>{" "}
                  {user.onlineResume?.title || "Chưa cập nhật"}
                </Card.Text>
                <div className="mb-2">
                  <strong>Kỹ năng nổi bật:</strong>
                  <div className="mt-1">
                    {user.onlineResume?.skills?.slice(0, 5).map((skill) => (
                      <Badge
                        pill
                        bg="primary"
                        key={skill.id}
                        className="me-1 mb-1"
                      >
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ProgressBar
                  now={score}
                  label={`${score}% phù hợp`}
                  variant={
                    score > 80 ? "success" : score > 60 ? "info" : "warning"
                  }
                  animated
                />
              </Card.Body>
              <Card.Footer className="text-end">
                {/* <<< BƯỚC 4: Thêm sự kiện onClick cho nút */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleViewProfile(user.id!)}
                >
                  Xem hồ sơ
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CandidateResults;
