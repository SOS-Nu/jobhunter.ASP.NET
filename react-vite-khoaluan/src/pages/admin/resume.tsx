import ViewDetailResume from "@/components/admin/resume/view.resume";
import DataTable from "@/components/client/data-table";
import Access from "@/components/share/access";
import { callDeleteResume } from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchResume } from "@/redux/slice/resumeSlide";
import { IResume } from "@/types/backend";
import {
  DownloadOutlined,
  EditOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  ActionType,
  ProColumns,
  ProFormSelect,
} from "@ant-design/pro-components";
import { Button, Space, Tag, Tooltip, message, notification } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfIn } from "spring-filter-query-builder";

const ResumePage = () => {
  const tableRef = useRef<ActionType>(null);

  const isFetching = useAppSelector((state) => state.resume.isFetching);
  const meta = useAppSelector((state) => state.resume.meta);
  const resumes = useAppSelector((state) => state.resume.result);
  const dispatch = useAppDispatch();

  const [dataInit, setDataInit] = useState<IResume | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

  const handleDeleteResume = async (id: string | undefined) => {
    if (id) {
      const res = await callDeleteResume(id);
      if (res && res.data) {
        message.success("Xóa Resume thành công");
        reloadTable();
      } else {
        notification.error({
          message: "Có lỗi xảy ra",
          description: res.message,
        });
      }
    }
  };

  const reloadTable = () => {
    tableRef?.current?.reload();
  };

  const columns: ProColumns<IResume>[] = [
    {
      title: "Id",
      dataIndex: "id",
      width: 50,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(record);
            }}
          >
            {record.id}
          </a>
        );
      },
      hideInSearch: true,
    },
    {
      title: "Điểm CV By AI",
      dataIndex: "score",
      render(dom, entity, index, action, schema) {
        return (
          <>
            <Tag color={entity.score ? "green" : "red"}>
              {entity.score ? entity.score : "Chưa có điểm"}
            </Tag>
          </>
        );
      },
      sorter: true,
      align: "center",

      hideInSearch: true,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      sorter: true,
      renderFormItem: (item, props, form) => (
        <ProFormSelect
          showSearch
          mode="multiple"
          allowClear
          valueEnum={{
            PENDING: "PENDING",
            REVIEWING: "REVIEWING",
            APPROVED: "APPROVED",
            REJECTED: "REJECTED",
          }}
          placeholder="Chọn level"
        />
      ),
    },
    // ===== CẬP NHẬT LẠI CỘT CV/RESUME =====
    {
      title: "CV/Resume",
      dataIndex: "url",
      width: 120, // Đặt độ rộng cố định
      align: "center", // Căn giữa nội dung trong cột
      hideInSearch: true,
      render: (text, record, index, action) => {
        return (
          <Space size="middle">
            <Tooltip title="Xem CV">
              <Button
                type="text"
                icon={
                  <FilePdfOutlined style={{ color: "red", fontSize: 18 }} />
                }
                href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${record.url}`}
                target="_blank"
              />
            </Tooltip>
            <Tooltip title="Tải xuống CV">
              <Button
                type="text"
                icon={
                  <DownloadOutlined
                    style={{ color: "#1890ff", fontSize: 18 }}
                  />
                }
                href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/files?fileName=${record.url}&folder=resume`}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: "email",
      dataIndex: ["email"],
      hideInSearch: true,
    },

    {
      title: "Job",
      dataIndex: ["job", "name"],
      // hideInSearch: true,
    },
    {
      title: "Company",
      dataIndex: "companyName",
      hideInSearch: true,
    },
    {
      title: "Cover Letter",
      dataIndex: "coverLetter",
      hideInSearch: true,
    },

    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return (
          <>
            {record.createdAt
              ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </>
        );
      },
      hideInSearch: false,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return (
          <>
            {record.updatedAt
              ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </>
        );
      },
      hideInSearch: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 100,
      render: (_value, entity, _index, _action) => (
        <Space>
          <EditOutlined
            style={{
              fontSize: 20,
              color: "#ffa500",
            }}
            type=""
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(entity);
            }}
          />

          {/* <Popconfirm
                        placement="leftTop"
                        title={"Xác nhận xóa resume"}
                        description={"Bạn có chắc chắn muốn xóa resume này ?"}
                        onConfirm={() => handleDeleteResume(entity.id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <span style={{ cursor: "pointer", margin: "0 10px" }}>
                            <DeleteOutlined
                                style={{
                                    fontSize: 20,
                                    color: '#ff4d4f',
                                }}
                            />
                        </span>
                    </Popconfirm> */}
        </Space>
      ),
    },
  ];

  const buildQuery = (params: any, sort: any, filter: any) => {
    const clone = { ...params };

    // Khởi tạo một mảng để chứa các điều kiện filter
    const filterParts = [];

    // Xử lý filter theo trạng thái (status)
    if (clone.status?.length) {
      filterParts.push(sfIn("status", clone.status).toString());
      delete clone.status;
    }

    // THÊM LOGIC NÀY: Xử lý filter theo tên job
    // Khi người dùng nhập vào ô tìm kiếm của cột "Job", ProTable sẽ truyền vào params với key là `job.name`
    // BẰNG ĐOẠN NÀY
    // Xử lý filter theo tên job (với dataIndex lồng nhau)
    if (clone.job?.name) {
      // Truy cập đúng vào clone.job.name
      filterParts.push(`job.name~'*${clone.job.name}*'`);

      // Quan trọng: Xóa cả object 'job' khỏi clone để không bị stringify thành [object Object]
      delete clone.job;
    }
    // Kết hợp các điều kiện filter bằng ' and '
    if (filterParts.length > 0) {
      clone.filter = filterParts.join(" and ");
    }

    clone.page = clone.current;
    clone.size = clone.pageSize;

    delete clone.current;
    delete clone.pageSize;

    let temp = queryString.stringify(clone);

    let sortBy = "";
    if (sort && sort.status) {
      sortBy = `sort=status,${sort.status === "ascend" ? "asc" : "desc"}`;
    }
    // THÊM LOGIC NÀY: Xử lý sort theo điểm CV
    if (sort && sort.score) {
      sortBy = `sort=score,${sort.score === "ascend" ? "asc" : "desc"}`;
    }
    if (sort && sort.createdAt) {
      sortBy = `sort=createdAt,${sort.createdAt === "ascend" ? "asc" : "desc"}`;
    }
    if (sort && sort.updatedAt) {
      sortBy = `sort=updatedAt,${sort.updatedAt === "ascend" ? "asc" : "desc"}`;
    }

    if (sortBy) {
      temp += `&${sortBy}`;
    } else {
      // Mặc định sort theo updatedAt giảm dần nếu không có sort nào khác
      temp += "&sort=updatedAt,desc";
    }

    temp += "&populate=job,user";

    return temp;
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.RESUMES.GET_PAGINATE}>
        <DataTable<IResume>
          actionRef={tableRef}
          headerTitle="Danh sách Resumes"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={resumes}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            dispatch(fetchResume({ query }));
          }}
          scroll={{ x: true }}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            showSizeChanger: true,
            total: meta.total,
            showTotal: (total, range) => {
              return (
                <div>
                  {" "}
                  {range[0]}-{range[1]} trên {total} rows
                </div>
              );
            },
          }}
          rowSelection={false}
          toolBarRender={(_action, _rows): any => {
            return <></>;
          }}
        />
      </Access>
      <ViewDetailResume
        open={openViewDetail}
        onClose={setOpenViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
        reloadTable={reloadTable}
      />
    </div>
  );
};

export default ResumePage;
