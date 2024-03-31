import { addRule, removeRule, rule, updateRule } from '@/services/ant-design-pro/api';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormText,
  ProFormTextArea,
  ProFormDatePicker,
  ProFormTimePicker,
  ProTable,
  ProFormSelect,
  ProFormUploadDragger,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Input, message, Tag, Row, Col, notification, Form } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import type { FormValueType } from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import axios from 'axios';
import _ from 'lodash'

/**
 * @en-US Add node
 * @zh-CN 添加节点
 * @param fields
 */
const handleAdd = async (fields: API.RuleListItem) => {
  const hide = message.loading('正在添加');
  try {
    await addRule({ ...fields });
    hide();
    message.success('Added successfully');
    return true;
  } catch (error) {
    hide();
    message.error('Adding failed, please try again!');
    return false;
  }
};

/**
 * @en-US Update node
 * @zh-CN 更新节点
 *
 * @param fields
 */
const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('Configuring');
  try {
    await updateRule({
      name: fields.name,
      desc: fields.desc,
      key: fields.key,
    });
    hide();

    message.success('Configuration is successful');
    return true;
  } catch (error) {
    hide();
    message.error('Configuration failed, please try again!');
    return false;
  }
};

/**
 *  Delete node
 * @zh-CN 删除节点
 *
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.RuleListItem[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    await removeRule({
      key: selectedRows.map((row) => row.key),
    });
    hide();
    message.success('Deleted successfully and will refresh soon');
    return true;
  } catch (error) {
    hide();
    message.error('Delete failed, please try again');
    return false;
  }
};

const TableList: React.FC = () => {
  /**
   * @en-US Pop-up window of new window
   * @zh-CN 新建窗口的弹窗
   *  */
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  /**
   * @en-US The pop-up window of the distribution update window
   * @zh-CN 分布更新窗口的弹窗
   * */
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm()
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const columns: any[] = [
    {
      title: '项目名',
      dataIndex: 'title',
      render: (__: any, record: any) => {
        return <a onClick={() => {
          let temp: any = _.cloneDeep(record)
          temp['image'] = [{
            uid: '-1',
            name: 'image.jpg',
            status: 'done',
            url: record.image
          }]
          form.setFieldsValue(temp)
          setCurrentRow(record)
          setShowDetail(true)
        }}>{record?.title}</a>
      }
    },
    {
      title: '发起人',
      dataIndex: 'organizer',
    },
    {
      title: '活动开始时间',
      dataIndex: 'startDate',
      render: (__: any, record: any) => {
        const { startDate, startTime } = record;
        return `${startDate} ${startTime}`;
      },
    },
    {
      title: '活动截止时间',
      dataIndex: 'endDate',
      render: (__: any, record: any) => {
        const { endDate, endTime } = record;
        return `${endDate} ${endTime}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (__: any, record: any) => {
        const { status } = record;
        let text = '待审批';
        let color = 'blue';
        switch (status) {
          case 'pending':
            text = '待审批';
            color = 'blue';
            break;
          case 'pass':
            text = '通过';
            color = 'green';
            break;
          case 'reject':
            text = '拒绝';
            color = 'red';
            break;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        if (record.status === 'pending') {
          const { id } = record;
          return [
            <a
              key='pass'
              //eslint-disable-next-line @typescript-eslint/no-use-before-define
              onClick={() => approvalHandler(id, 'pass')}
            >
              通过
            </a>,
            <a key='reject'
              //eslint-disable-next-line @typescript-eslint/no-use-before-define
               onClick={() => approvalHandler(id, 'reject')} style={{ color: '#f50' }}>
              拒绝
            </a>,
          ];
        }
        return [];
      },
    },
  ];

  const fetchData = async () => {
    const res: any = await axios.get('http://localhost:5001/sport/list');
    if (res) {
      console.log('res:', res);
      return {
        success: true,
        data: res.data.results,
        total: res.data.total,
      };
    }
  };

  const approvalHandler = async (id: string, status: string) => {
    const res: any = await axios.post('http://localhost:5001/sport/approve', {
      sportId: id,
      status,
    });
    if (res.data) {
      notification.success({
        message: '审批操作',
        description: '审批成功！',
        duration: 3
      })
      actionRef.current.reload()
    }
  };

  const createSportHandler = async (values) => {
    console.log('values:', values);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });

      // Send a POST request to your backend endpoint
      const res = await axios.post('http://localhost:5001/sport/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', res.data);
      notification.success({
        message: '成功',
        description: '新增运动项目成功',
        duration: 3
      })
      actionRef.current.reload()
      // Handle success (e.g., show a success message, redirect, etc.)
    } catch (error) {
      console.error('Error:', error);
      notification.error({
        message: '错误',
        description: error.message || error.data.message,
        duration: 0
      })
    }
  };

  const updateSportHandler = async (values) => {
    console.log('values:', values);
    try {
      const formData = new FormData();
      formData.append('id', currentRow.id)
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });

      // Send a POST request to your backend endpoint
      const res = await axios.post('http://localhost:5001/sport/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', res.data);
      notification.success({
        message: '成功',
        description: '更新运动项目成功',
        duration: 3
      })
      actionRef.current.reload()
      setShowDetail(false)
      setCurrentRow({})
      // Handle success (e.g., show a success message, redirect, etc.)
    } catch (error) {
      console.error('Error:', error);
      notification.error({
        message: '错误',
        description: error.message || error.data.message,
        duration: 0
      })
    }
  };


  return (
    <PageContainer>
      <ProTable<API.RuleListItem, API.PageParams>
        headerTitle='项目列表'
        actionRef={actionRef}
        rowKey='key'
        search={false}
        toolBarRender={() => [
          <Button
            type='primary'
            key='primary'
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id='pages.searchTable.new' defaultMessage='New' />
          </Button>,
        ]}
        request={fetchData}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id='pages.searchTable.chosen' defaultMessage='Chosen' />{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage id='pages.searchTable.item' defaultMessage='项' />
              &nbsp;&nbsp;
              <span>
                <FormattedMessage
                  id='pages.searchTable.totalServiceCalls'
                  defaultMessage='Total number of service calls'
                />{' '}
                {selectedRowsState.reduce((pre, item) => pre + item.callNo!, 0)}{' '}
                <FormattedMessage id='pages.searchTable.tenThousand' defaultMessage='万' />
              </span>
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage
              id='pages.searchTable.batchDeletion'
              defaultMessage='Batch deletion'
            />
          </Button>
          <Button type='primary'>
            <FormattedMessage
              id='pages.searchTable.batchApproval'
              defaultMessage='Batch approval'
            />
          </Button>
        </FooterToolbar>
      )}
      <ModalForm
        title='新建运动项目'
        width='488px'
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={createSportHandler}
      >
        <ProFormText
          label='项目名称'
          width='lg'
          name='title'
        />
        <ProFormText label='发起人' width='lg' name='organizer' />
        <Row>
          <Col span={12}>
            <ProFormDatePicker label='活动开始日期' name='startDate' fieldProps={{format: 'YYYY-MM-DD'}} />
          </Col>
          <Col span={12}>
            <ProFormTimePicker label='活动开始时间' name='startTime' fieldProps={{format: 'HH:mm'}} />
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <ProFormDatePicker label='活动结束日期' name='endDate' fieldProps={{format: 'YYYY-MM-DD'}} />
          </Col>
          <Col span={12}>
            <ProFormTimePicker label='活动结束时间' name='endTime' fieldProps={{format: 'HH:mm'}} />
          </Col>
        </Row>
        <ProFormSelect mode='tags' label='标签' name='tags' style={{ width: '440px' }} />
        <div style={{ width: '440px' }}>
          <ProFormUploadDragger name='image' fieldProps={{ multiple: false, maxCount: 1 }} />
        </div>
        <ProFormTextArea label='活动内容' width='lg' name='content' />
      </ModalForm>
      <ModalForm
        form={form}
        title='编辑运动项目'
        width='488px'
        open={showDetail}
        onOpenChange={(opened) => setShowDetail(opened)}
        request={async () => {
          console.log("-> currentRow", currentRow);
          return {
            data: currentRow
          }
        }}
        onFinish={updateSportHandler}
      >
        <ProFormText
          label='项目名称'
          width='lg'
          name='title'
        />
        <ProFormText label='发起人' width='lg' name='organizer' />
        <Row>
          <Col span={12}>
            <ProFormDatePicker label='活动开始日期' name='startDate' fieldProps={{format: 'YYYY-MM-DD'}} />
          </Col>
          <Col span={12}>
            <ProFormTimePicker label='活动开始时间' name='startTime' fieldProps={{format: 'HH:mm'}} />
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <ProFormDatePicker label='活动结束日期' name='endDate' fieldProps={{format: 'YYYY-MM-DD'}} />
          </Col>
          <Col span={12}>
            <ProFormTimePicker label='活动结束时间' name='endTime' fieldProps={{format: 'HH:mm'}} />
          </Col>
        </Row>
        <ProFormSelect mode='tags' label='标签' name='tags' style={{ width: '440px' }} />
        <div style={{ width: '440px' }}>
          <ProFormUploadDragger name='image' fieldProps={{ multiple: false, maxCount: 1 }} />
        </div>
        <ProFormTextArea label='活动内容' width='lg' name='content' />
      </ModalForm>
      <UpdateForm
        onSubmit={async (value) => {
          const success = await handleUpdate(value);
          if (success) {
            handleUpdateModalOpen(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
        onCancel={() => {
          handleUpdateModalOpen(false);
          if (!showDetail) {
            setCurrentRow(undefined);
          }
        }}
        updateModalOpen={updateModalOpen}
        values={currentRow || {}}
      />

      {/*<Drawer*/}
      {/*  width={600}*/}
      {/*  open={showDetail}*/}
      {/*  onClose={() => {*/}
      {/*    setCurrentRow(undefined);*/}
      {/*    setShowDetail(false);*/}
      {/*  }}*/}
      {/*  closable={false}*/}
      {/*>*/}
      {/*  {currentRow?.id && (*/}
      {/*    <ProDescriptions<API.RuleListItem>*/}
      {/*      column={1}*/}
      {/*      title={currentRow?.name}*/}
      {/*      request={async () => ({*/}
      {/*        data: currentRow || {},*/}
      {/*      })}*/}
      {/*      params={{*/}
      {/*        id: currentRow?.id,*/}
      {/*      }}*/}
      {/*      columns={columns as ProDescriptionsItemProps<API.RuleListItem>[]}*/}
      {/*    />*/}
      {/*  )}*/}
      {/*</Drawer>*/}
    </PageContainer>
  );
};

export default TableList;
