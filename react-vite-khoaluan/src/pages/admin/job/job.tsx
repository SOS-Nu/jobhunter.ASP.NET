// src/pages/admin/job/JobPage.tsx

import DataTable from "@/components/client/data-table";
import Access from "@/components/share/access";
import { callDeleteJob, callDeleteJobForCompany } from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchJob } from "@/redux/slice/jobSlide";
import { IJob, ISkill, IUser } from "@/types/backend";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  ActionType,
  ProColumns,
  ProFormSelect,
} from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag, message, notification } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useMemo, useRef, useState } from "react";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import ImportJob from "../data/import.job";

const JobPage = () => {
  const tableRef = useRef<ActionType>(null);

  const isFetching = useAppSelector((state) => state.job.isFetching);
  const meta = useAppSelector((state) => state.job.meta);
  const jobs = useAppSelector((state) => state.job.result);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openModalImportJob, setOpenModalImportJob] = useState<boolean>(false);
  const user = useAppSelector((state) => state.account.user) as IUser;

  // Cập nhật jobExport để bao gồm trường address
  const jobExport = useMemo(() => {
    return (jobs || []).map((item) => ({
      ...item,
      company: item.company?.name ?? "",
      skills: item.skills.map((skill: ISkill) => `[id ${skill.id}]`).join(","),
    }));
  }, [jobs]);

  const handleDeleteJob = async (id: string | undefined) => {
    if (id) {
      let res;
      if (user.role?.name === "SUPER_ADMIN") {
        res = await callDeleteJob(id);
      } else if (user.company?.id) {
        res = await callDeleteJobForCompany(user.company.id);
      }

      if (res && res.data) {
        message.success("Xóa Job thành công");
        reloadTable();
      } else {
        notification.error({
          message: "Có lỗi xảy ra",
          description: res?.message,
        });
      }
    }
  };

  const reloadTable = () => {
    tableRef?.current?.reload();
  };

  const columns: ProColumns<IJob>[] = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center",
      render: (text, record, index) => {
        return <>{index + 1 + (meta.page - 1) * meta.pageSize}</>;
      },
      hideInSearch: true,
    },
    {
      title: "Tên Job",
      dataIndex: "name",
      sorter: true,
    },
    // NEW: Thêm cột địa chỉ
    {
      title: "Địa chỉ",
      dataIndex: "location",
      sorter: true,
    },
    {
      title: "Công ty",
      dataIndex: ["company", "name"],
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Mức lương",
      dataIndex: "salary",
      sorter: true,
      render(dom, entity, index, action, schema) {
        const str = "" + entity.salary;
        return <>{str?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} đ</>;
      },
    },
    {
      title: "Level",
      dataIndex: "level",
      renderFormItem: (item, props, form) => (
        <ProFormSelect
          showSearch
          mode="multiple"
          allowClear
          valueEnum={{
            INTERN: "INTERN",
            FRESHER: "FRESHER",
            JUNIOR: "JUNIOR",
            MIDDLE: "MIDDLE",
            SENIOR: "SENIOR",
          }}
          placeholder="Chọn level"
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      render(dom, entity, index, action, schema) {
        return (
          <>
            <Tag color={entity.active ? "lime" : "red"}>
              {entity.active ? "ACTIVE" : "INACTIVE"}
            </Tag>
          </>
        );
      },
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
      hideInSearch: true,
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
      width: 50,
      render: (_value, entity, _index, _action) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.JOBS.UPDATE} hideChildren>
            <EditOutlined
              style={{
                fontSize: 20,
                color: "#ffa500",
              }}
              type=""
              onClick={() => {
                navigate(`/admin/job/upsert?id=${entity.id}`);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.JOBS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa job"}
              description={"Bạn có chắc chắn muốn xóa job này ?"}
              onConfirm={() => handleDeleteJob(entity.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <span style={{ cursor: "pointer", margin: "0 10px" }}>
                <DeleteOutlined
                  style={{
                    fontSize: 20,
                    color: "#ff4d4f",
                  }}
                />
              </span>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  const buildQuery = (params: any, sort: any, filter: any) => {
    const clone = { ...params };
    const filterParts: string[] = [];
    if (clone.name) filterParts.push(`name@=${clone.name}`);
    if (clone.salary) filterParts.push(`salary==${clone.salary}`);
    if (clone.location) filterParts.push(`location@=${clone.location}`);

    if (clone?.level?.length) {
      filterParts.push(clone.level.map((item: any) => "level==" + item).join("|"));
    }

    if (filterParts.length > 0) {
      clone.filters = filterParts.join(",");
    } else {
      delete clone.filters;
    }

    clone.page = clone.current;
    clone.pageSize = clone.pageSize;

    delete clone.current;
    delete clone.pageSize;
    delete clone.name;
    delete clone.salary;
    delete clone.location;
    delete clone.level;

    let temp = queryString.stringify(clone);

    let sortBy = "";
    const fields = ["name", "location", "salary", "createdAt", "updatedAt"];
    if (sort) {
      for (const field of fields) {
        if (sort[field]) {
          sortBy = `sorts=${sort[field] === "ascend" ? "" : "-"}${field}`;
          break;
        }
      }
    }

    if (Object.keys(sortBy).length === 0) {
      temp = `${temp}&sorts=-updatedAt`;
    } else {
      temp = `${temp}&${sortBy}`;
    }

    return temp;
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.JOBS.GET_PAGINATE}>
        <DataTable<IJob>
          actionRef={tableRef}
          headerTitle="Danh sách Jobs"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={jobs}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            dispatch(fetchJob({ query, user }));
          }}
          scroll={{ x: true }}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            size: "default",
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
            return (
              <>
                <CSVLink data={jobExport} filename="export-jobs.csv">
                  <Button icon={<ExportOutlined />} type="primary">
                    Export
                  </Button>
                </CSVLink>
                {user.role?.name === "SUPER_ADMIN" && (
                  <Button
                    icon={<CloudUploadOutlined />}
                    type="primary"
                    onClick={() => setOpenModalImportJob(true)}
                  >
                    Import
                  </Button>
                )}

                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => navigate("upsert")}
                >
                  Thêm mới
                </Button>
              </>
            );
          }}
        />
      </Access>
      {user.role?.name === "SUPER_ADMIN" && (
        <ImportJob
          openModalImportJob={openModalImportJob}
          setOpenModalImportJob={setOpenModalImportJob}
          reloadTable={reloadTable}
        />
      )}
    </div>
  );
};

export default JobPage;
