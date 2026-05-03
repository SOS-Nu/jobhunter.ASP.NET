// src/components/company/CompanyReviews.tsx

import { IComment, ICompany, IModelPaginate } from "@/types/backend";
import { useEffect, useState } from "react";

import { callCreateComment, callFetchCommentsByCompany, callUpdateComment } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import { Comment } from "@ant-design/compatible";
import { EditOutlined, InfoCircleOutlined, LockOutlined } from "@ant-design/icons";
import {
  Avatar,
  Empty,
  Form,
  Input,
  List,
  notification,
  Pagination,
  Rate,
  Skeleton,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

dayjs.extend(relativeTime);

interface IProps {
  companyId: number;
  companyDetail?: ICompany;
  onCommentSuccess?: () => void;
}

const CompanyReviews = ({
  companyId,
  companyDetail,
  onCommentSuccess,
}: IProps) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [reviews, setReviews] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [meta, setMeta] = useState<IModelPaginate<IComment>["meta"] | null>(
    null,
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const currentUser = useAppSelector((state) => state.account.user);

  const fetchReviews = async () => {
    setIsLoading(true);
    const page = searchParams.get("review_page") || "1";
    const res = await callFetchCommentsByCompany(
      companyId.toString(),
      `page=${page}&pageSize=5&sorts=-createdAt`,
    );
    if (res?.data) {
      setReviews(res.data.result);
      setMeta(res.data.meta);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [searchParams, companyId]);

  const handleOnFinish = async (values: {
    comment: string;
    rating: number;
  }) => {
    if (!companyId) return;

    setIsSubmitting(true);
    try {
      const res = await callCreateComment({ ...values, companyId });

      if (res?.data) {
        notification.success({ message: "Gửi đánh giá thành công!" });
        form.resetFields();
        await fetchReviews();
        if (onCommentSuccess) {
          onCommentSuccess();
        }
      }
    } catch (error: any) {
      console.error("Check review error:", error);
      notification.error({
        message: "Gửi đánh giá thất bại",
        description:
          error?.response?.data?.message || error?.message || "Lỗi hệ thống",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: {
    comment: string;
    rating: number;
  }) => {
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      const res = await callUpdateComment({
        id: editingId,
        comment: values.comment,
        rating: values.rating
      });

      if (res?.data) {
        notification.success({ message: "Cập nhật đánh giá thành công!" });
        setEditingId(null);
        await fetchReviews();
      }
    } catch (error: any) {
      notification.error({
        message: "Cập nhật thất bại",
        description: error?.response?.data?.message || "Lỗi hệ thống",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams(
      (prev) => {
        prev.set("review_page", page.toString());
        return prev;
      },
      { replace: true },
    );
  };

  // ... (giữ nguyên các import và logic fetch)

  return (
    <div className="company-reviews-container">
      {/* KHU VỰC GỬI ĐÁNH GIÁ */}
      <div className="review-form-section">
        {!isAuthenticated ? (
          <div className="review-notice auth-required">
            <LockOutlined className="notice-icon" />
            <span className="notice-text">
              Vui lòng{" "}
              <b
                onClick={() =>
                  (window.location.href = `/login?callback=${window.location.pathname}${window.location.search}`)
                }
                style={{ cursor: "pointer" }}
              >
                đăng nhập
              </b>{" "}
              để để lại đánh giá.
            </span>
          </div>
        ) : !companyDetail?.comment ? (
          <div className="review-notice permission-denied">
            <InfoCircleOutlined className="notice-icon" />
            <span className="notice-text">
              Hệ thống ghi nhận bạn chưa thể đánh giá. Tài khoản cần có hồ sơ{" "}
              <b>Approved</b> tại công ty này và chưa từng gửi đánh giá trước
              đó.
            </span>
          </div>
        ) : (
          <Comment
            avatar={
              <Avatar
                size="large"
                src={`${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${currentUser?.avatar}`}
              ></Avatar>
            }
            content={
              <Form form={form} onFinish={handleOnFinish}>
                <Form.Item
                  name="rating"
                  rules={[{ required: true, message: "Vui lòng chọn số sao!" }]}
                >
                  <Rate />
                </Form.Item>
                <Form.Item
                  name="comment"
                  rules={[
                    { required: true, message: "Vui lòng viết đánh giá!" },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Viết đánh giá của bạn về công ty..."
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    disabled={isSubmitting}
                    className="btn-primary"
                    onClick={() => form.submit()}
                  >
                    Gửi đánh giá
                  </Button>
                </Form.Item>
              </Form>
            }
          />
        )}
      </div>

      {/* DANH SÁCH ĐÁNH GIÁ */}
      <div className="reviews-list-section">
        {isLoading ? (
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        ) : reviews.length > 0 ? (
          <List
            header={`${meta?.total || 0} đánh giá từ ứng viên`}
            itemLayout="horizontal"
            dataSource={reviews}
            renderItem={(item) => (
              <div className="review-item-card">
                <Comment
                  author={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <a>{item.user.name}</a>
                      &nbsp;&nbsp;&nbsp;
                      {currentUser?.email === item.user.email && (
                        <Tooltip title="Chỉnh sửa">
                          <EditOutlined
                            onClick={() => {
                              setEditingId(item.id || null);
                              editForm.setFieldsValue({
                                comment: item.comment,
                                rating: item.rating
                              });
                            }}
                            style={{ cursor: 'pointer', color: '#1677ff' }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  }
                  avatar={
                    <Avatar
                      src={`${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${item?.user?.avatar
                        }`}
                    >
                      {item.user.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                  }
                  content={
                    editingId === item.id ? (
                      <Form form={editForm} onFinish={handleUpdate}>
                        <Form.Item
                          name="rating"
                          rules={[{ required: true, message: "Vui lòng chọn số sao!" }]}
                        >
                          <Rate />
                        </Form.Item>
                        <Form.Item
                          name="comment"
                          rules={[{ required: true, message: "Vui lòng viết đánh giá!" }]}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Button
                            size="sm"
                            disabled={isSubmitting}
                            variant="primary"
                            onClick={() => editForm.submit()}
                          >
                            Cập nhật
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <div className="review-content">
                        <Rate disabled allowHalf value={item.rating} />
                        <p>{item.comment}</p>
                      </div>
                    )
                  }
                  datetime={
                    <Tooltip
                      title={dayjs(item.createdAt).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    >
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                    </Tooltip>
                  }
                />
              </div>
            )}
          />
        ) : (
          <Empty description="Chưa có đánh giá nào cho công ty này." />
        )}

        {/* PHÂN TRANG */}
        {meta && meta.total > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "30px",
            }}
          >
            <Pagination
              current={meta.page}
              total={meta.total}
              pageSize={meta.pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyReviews;
