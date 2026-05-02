import ModalCompany from "@/components/admin/company/modal.company";
import DataTable from "@/components/client/data-table";
import Access from "@/components/share/access";
import { callDeleteCompany } from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import {
  FIELD_LIST,
  LOCATION_LIST,
  nonAccentVietnamese,
  SCALE_LIST,
} from "@/config/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCompany } from "@/redux/slice/companySlide";
import { ICompany } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  AutoComplete,
  Button,
  message,
  notification,
  Popconfirm,
  Space,
} from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfLike } from "spring-filter-query-builder";

const CompanyPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<ICompany | null>(null);

  const tableRef = useRef<ActionType>(null);

  const isFetching = useAppSelector((state) => state.company.isFetching);
  const meta = useAppSelector((state) => state.company.meta);
  const companies = useAppSelector((state) => state.company.result);
  const dispatch = useAppDispatch();

  const handleDeleteCompany = async (id: string | undefined) => {
    if (id) {
      const res = await callDeleteCompany(id);
      if (res && +res.statusCode === 200) {
        message.success("Xóa Company thành công");
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

  const columns: ProColumns<ICompany>[] = [
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
      title: "Tên công ty",
      dataIndex: "name",
      sorter: true,
    },
    // >> THAY ĐỔI CỘT NÀY
    {
      title: "Lĩnh vực",
      dataIndex: "field",
      sorter: true,
      // Dùng renderFormItem để tùy chỉnh thành AutoComplete
      renderFormItem: () => (
        <AutoComplete
          options={FIELD_LIST}
          placeholder="Nhập hoặc chọn lĩnh vực"
          filterOption={(inputValue, option) => {
            // Nếu không có option thì chắc chắn là false
            if (!option) return false;

            // Nếu có thì thực hiện so sánh
            return nonAccentVietnamese(option.label.toLowerCase()).includes(
              nonAccentVietnamese(inputValue.toLowerCase()),
            );
          }}
          allowClear
        />
      ),
    },
    // << KẾT THÚC THAY ĐỔI
    {
      title: "Quy mô",
      dataIndex: "scale",
      sorter: true,
      // Chuyển thành ô chọn (dropdown)
      valueType: "select",
      fieldProps: {
        options: SCALE_LIST,
      },
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      sorter: true,
      // Chuyển thành ô chọn (dropdown)
      valueType: "select",
      fieldProps: {
        options: LOCATION_LIST.filter((item) => item.value !== "tatca"), // Bỏ lựa chọn "Tất cả"
      },
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      sorter: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => (
        <>
          {record.createdAt
            ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
            : ""}
        </>
      ),
      hideInSearch: true,
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => (
        <>
          {record.updatedAt
            ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
            : ""}
        </>
      ),
      hideInSearch: true,
    },
    {
      title: "Avarage Rating",
      dataIndex: "averageRating",
      sorter: true,
    },
    {
      title: "Totals Comments",
      dataIndex: "totalComments",
      sorter: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity, _index, _action) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.COMPANIES.UPDATE} hideChildren>
            <EditOutlined
              style={{ fontSize: 20, color: "#ffa500" }}
              onClick={() => {
                setOpenModal(true);
                setDataInit(entity);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.COMPANIES.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa company"}
              description={"Bạn có chắc chắn muốn xóa company này ?"}
              onConfirm={() => handleDeleteCompany(entity.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <span style={{ cursor: "pointer", margin: "0 10px" }}>
                <DeleteOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
              </span>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  const buildQuery = (params: any, sort: any, filter: any) => {
    const clone = { ...params };
    const q: any = {
      page: params.current,
      size: params.pageSize,
    };

    const searchableFields = ["name", "field", "scale", "location", "address"];
    const filterConditions: string[] = [];

    searchableFields.forEach((field) => {
      if (clone[field]) {
        // Với valueType là 'select', ProTable sẽ trả về giá trị chính xác,
        // nên ta có thể dùng điều kiện bằng (eq) hoặc giống (like).
        // `like` sẽ linh hoạt hơn nếu backend hỗ trợ.
        filterConditions.push(sfLike(field, clone[field]).toString());
      }
    });

    if (filterConditions.length > 0) {
      q.filter = filterConditions.join(" and ");
    }

    let temp = queryString.stringify(q);

    let sortBy = "";
    const sortableFields = [
      "name",
      "address",
      "field",
      "scale",
      "location",
      "createdAt",
      "updatedAt",
    ];
    for (const field of sortableFields) {
      if (sort && sort[field]) {
        sortBy = `sort=${field},${sort[field] === "ascend" ? "asc" : "desc"}`;
        break;
      }
    }

    if (sortBy) {
      temp = `${temp}&${sortBy}`;
    } else {
      temp = `${temp}&sort=updatedAt,desc`;
    }

    return temp;
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}>
        <DataTable<ICompany>
          actionRef={tableRef}
          headerTitle="Danh sách Công Ty"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={companies}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            dispatch(fetchCompany({ query }));
          }}
          scroll={{ x: true }}
          pagination={{
            size: "default",

            current: meta.page,
            pageSize: meta.pageSize,
            showSizeChanger: true,
            total: meta.total,
            showTotal: (total, range) => (
              <div>
                {range[0]}-{range[1]} trên {total} rows
              </div>
            ),
          }}
          rowSelection={false}
          toolBarRender={() => [
            <Access permission={ALL_PERMISSIONS.COMPANIES.CREATE} hideChildren>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setOpenModal(true)}
              >
                Thêm mới
              </Button>
            </Access>,
          ]}
        />
      </Access>
      <ModalCompany
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={reloadTable}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default CompanyPage;
