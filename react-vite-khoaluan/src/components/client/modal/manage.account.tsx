import {
  Modal,
  Tabs,
  Tab,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import { isMobile } from "react-device-detect";
import { IResume, ISubscribers, ISkill } from "@/types/backend";
import { useState, useEffect } from "react";
import {
  callCreateSubscriber,
  callFetchAllSkill,
  callFetchResumeByUser,
  callGetSubscriberSkills,
  callUpdateSubscriber,
} from "@/config/api";
import dayjs from "dayjs";
import { useAppSelector } from "@/redux/hooks";
import Select from "react-select"; // Import react-select
import { MonitorOutlined } from "@ant-design/icons"; // Có thể giữ lại icon nếu muốn
import "@/styles/stylespotfolio/manage-account.scss"; // File SCSS mới cho component này
import ChangePasswordTab from "@/components/account/ChangePasswordTab";
import UpdateInfoTab from "@/components/account/UpdateInfoTab";
import VipAccountTab from "@/components/account/VipAccountTab";

// Giao diện cho props
interface IProps {
  open: boolean;
  onClose: (v: boolean) => void;
}

// Giao diện cho tùy chọn của react-select
interface ISkillOption {
  label: string;
  value: string;
}

//================================================================
// Component con: Bảng quản lý CV đã rải
//================================================================
const UserResume = () => {
  const [listCV, setListCV] = useState<IResume[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setIsFetching(true);
      const res = await callFetchResumeByUser();
      if (res && res.data) {
        setListCV(res.data.result as IResume[]);
      }
      setIsFetching(false);
    };
    init();
  }, []);

  return (
    <div className="user-resume-container">
      {isFetching ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Table striped bordered hover responsive className="align-middle">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th>Công Ty</th>
              <th>Vị trí</th>
              <th>Trạng thái</th>
              <th>Ngày rải CV</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {listCV.map((cv, index) => (
              <tr key={cv.id}>
                <td className="text-center">{index + 1}</td>
                <td>{cv?.companyName}</td>
                <td>{cv?.job?.name}</td>
                <td>
                  <Badge
                    bg={
                      cv.status === "PENDING"
                        ? "warning"
                        : cv.status === "APPROVED"
                          ? "success"
                          : "danger"
                    }
                  >
                    {cv.status}
                  </Badge>
                </td>
                <td>{dayjs(cv.createdAt).format("DD-MM-YYYY HH:mm:ss")}</td>
                <td className="text-center">
                  <Button
                    size="sm"
                    href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${cv?.url}`}
                    target="_blank"
                  >
                    Chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

//================================================================
// Component con: Đăng ký nhận Job qua Email
//================================================================
const JobByEmail = () => {
  const user = useAppSelector((state) => state.account.user);
  const [allSkills, setAllSkills] = useState<ISkillOption[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<ISkillOption[]>([]);
  const [subscriber, setSubscriber] = useState<ISubscribers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "danger";
    message: string;
  }>({ show: false, variant: "success", message: "" });

  useEffect(() => {
    const init = async () => {
      // 1. Fetch tất cả skill có thể chọn
      const skillRes = await callFetchAllSkill(
        "page=1&size=100&sort=createdAt,desc"
      );
      if (skillRes && skillRes.data) {
        const options = skillRes.data.result.map((item) => ({
          value: item.id!,
          label: item.name!,
        }));
        setAllSkills(options);
      }

      // 2. Fetch skill người dùng đã đăng ký
      const subRes = await callGetSubscriberSkills();
      if (subRes && subRes.data) {
        setSubscriber(subRes.data);
        const userSkills = subRes.data.skills.map((item: any) => ({
          value: item.id,
          label: item.name,
        }));
        setSelectedSkills(userSkills);
      }
    };
    init();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setAlert({ ...alert, show: false });

    if (selectedSkills.length === 0) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Vui lòng chọn ít nhất 1 kỹ năng!",
      });
      setIsLoading(false);
      return;
    }

    const skillIds = selectedSkills.map((skill) => ({ id: skill.value }));

    let res;
    if (!subscriber?.id) {
      // Create new subscriber
      const data = {
        email: user.email,
        name: user.name,
        skills: skillIds,
      };
      res = await callCreateSubscriber(data as any);
    } else {
      // Update existing subscriber
      const data = {
        id: subscriber.id,
        skills: skillIds,
      };
      res = await callUpdateSubscriber(data as any);
    }

    setIsLoading(false);
    if (res && res.data) {
      setSubscriber(res.data);
      setAlert({
        show: true,
        variant: "success",
        message: "Cập nhật thông tin thành công!",
      });
    } else {
      setAlert({
        show: true,
        variant: "danger",
        message: res?.message ?? "Có lỗi xảy ra, vui lòng thử lại.",
      });
    }
  };

  // Custom styles cho react-select để hợp với theme

  const getCssVar = (name: string) => {
    // Đảm bảo code chỉ chạy ở client-side
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  };

  // Tạo object style động dựa trên biến CSS
  const themedSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: getCssVar("--background-input-search"),
      borderColor: getCssVar("--border-input-search"),
      color: getCssVar("--text-white"),
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: getCssVar("--background-dropdown-search"),
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      background: state.isSelected
        ? getCssVar("--linear-gradient-blue-purple")
        : state.isFocused
          ? getCssVar("--linear-gradient-blue-purple")
          : "transparent",
      color: getCssVar("--text-white"),
    }),
    multiValue: (provided: any) => ({
      ...provided,
      background: getCssVar("--linear-gradient-blue-purple"),
      borderRadius: "30px",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: getCssVar("--text-white"),
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: getCssVar("--text-white"),
      ":hover": {
        backgroundColor: getCssVar("--brand-social"),
        color: "white",
      },
    }),
    input: (provided: any) => ({
      // Đảm bảo text bạn gõ vào cũng có màu đúng
      ...provided,
      color: getCssVar("--text-white"),
    }),
    placeholder: (provided: any) => ({
      // Màu cho placeholder
      ...provided,
      color: getCssVar("--text-gray"),
    }),
    singleValue: (provided: any) => ({
      // Màu cho giá trị khi đã chọn (cho select đơn)
      ...provided,
      color: getCssVar("--text-white"),
    }),
  };

  return (
    <div className="job-by-email-container">
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <Form.Group controlId="skillsSelect">
              <Form.Label className="form-label-custom">
                Chọn kỹ năng bạn quan tâm
              </Form.Label>
              <Select
                isMulti
                name="skills"
                options={allSkills}
                className="basic-multi-select"
                classNamePrefix="select"
                value={selectedSkills}
                onChange={(selectedOptions) =>
                  setSelectedSkills(selectedOptions as ISkillOption[])
                }
                placeholder={
                  <>
                    <MonitorOutlined /> Tìm theo kỹ năng...
                  </>
                }
                styles={themedSelectStyles}
                isLoading={!allSkills.length}
              />
              <Form.Text>
                Hệ thống sẽ tự động gửi email cho bạn khi có công việc mới phù
                hợp với các kỹ năng đã chọn.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              className="update-btn"
            >
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> &nbsp; Đang
                  xử lý...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

//================================================================
// Component chính: Quản lý tài khoản
//================================================================
const ManageAccount = (props: IProps) => {
  const { open, onClose } = props;
  const user = useAppSelector((state) => state.account.user);

  return (
    <Modal
      show={open}
      onHide={() => onClose(false)}
      size="xl"
      centered
      backdrop="static"
      keyboard={false}
      className="manage-account-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Quản lý tài khoản</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          defaultActiveKey="user-resume"
          id="manage-account-tabs"
          className="mb-3"
          justify
        >
          {user?.company ? null : (
            <Tab eventKey="user-resume" title="Lịch sử rải CV">
              <UserResume />
            </Tab>
          )}
          {user?.company ? null : (
            <Tab eventKey="email-by-skills" title="Nhận Jobs qua Email">
              <JobByEmail />
            </Tab>
          )}

          <Tab eventKey="user-update-info" title="Cập nhật thông tin">
            <UpdateInfoTab />
          </Tab>
          <Tab eventKey="vip-account" title="Tài khoản VIP">
            <VipAccountTab />
          </Tab>
          {/* SỬA ĐỔI Ở ĐÂY */}
          <Tab eventKey="user-password" title="Thay đổi mật khẩu">
            {/* Thay thế TODO comment bằng component mới */}
            <ChangePasswordTab />
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default ManageAccount;
