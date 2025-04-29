import React, { useState, useReducer, useEffect, useMemo, lazy, useRef } from "react";
import useFormQueries from "../../queries/forms";
import { Row, Col, Form, Button, ButtonGroup, Modal, Accordion, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { format, endOfToday, subDays } from "date-fns";
import DataTable from 'react-data-table-component';
import { AppButton, Loading, DescriptionPopover, WorkflowExpandedComponent } from "../../blocks/components";
import { displayFormCode } from "../form";
import useListsQueries from "../../queries/lists";
import useCodesQueries from "../../queries/codes";
import { useQueryClient } from "react-query";
import { useSettingsContext, useAuthContext } from "../../app";
import useGroupQueries from "../../queries/groups";
import { find, orderBy, pick } from "lodash";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import useUserQueries from "../../queries/users";

const ArchiveView = lazy(()=>import("./view"));

const defaultValues = {
    days:30,
    startDate:subDays(endOfToday(),31),
    endDate:endOfToday(),
    formId:'',
    personName:'',
    effectiveDate:null,
    formCode:'',
    actionCode:'',
    transactionCode:'',
    payroll:'',
    lineNumber:'',
    benefitFlag:'',
    createdBy:'',
    page:1,
    results:10,
    sortField:'effdate',
    sortDir:'desc'
};

export default function ListArchiveTable() {
    const {isAdmin} = useAuthContext();
    const {general} = useSettingsContext();

    const accordionViewRef = useRef();

    const [data,setData] = useState([]);
    const [userData,setUserData] = useState([]);
    const [totalRows,setTotalRows] = useState(0);
    const [submitted,setSubmitted] = useState(false);
    const [selectedRowId,setSelectedRowId] = useState();

    const { getUsers } = useUserQueries();
    const { getGroups } = useGroupQueries();
    const users = getUsers({onSuccess: d => {
        const r = orderBy(d.filter(u=>(!!u.LEGAL_FIRST_NAME&&!!u.LEGAL_LAST_NAME)),['LEGAL_LAST_NAME','LEGAL_FIRST_NAME'],['asc','asc']).map(u=>({id:u.SUNY_ID, label:`${u.LEGAL_FIRST_NAME} ${u.LEGAL_LAST_NAME}`}));
        setUserData(r);
    }});
    const groups = getGroups();

    const calculateDates = args => {
        const obj = {...args};
        if (args.days>0) {
            obj.endDate = endOfToday();
            obj.startDate = subDays(obj.endDate, parseInt(args.days)+1);
        }
        return obj;
    }

    const [filter,setFilter] = useReducer((state,action) => {
        let newState = {};
        if (action?.formId) {
            newState = {...defaultValues, ...action};
        } else {
            const dates = calculateDates(action);
            newState = {...state, ...action,...dates};
        }
        return newState;
    },defaultValues,calculateDates);

    const queryClient = useQueryClient();
    const {getArchiveFormList} = useFormQueries();
    const listdata = getArchiveFormList(filter,{
        enabled:submitted,
        keepPreviousData:true,
        staleTime:30000
    });

    const handleSearch = () => {
        setSubmitted(true);
    }

    const handleReset = (reset=true) => {
        setSubmitted(false);
        setSelectedRowId(null);
        queryClient.removeQueries(['archivelist','form']);
        setData([]);
        if (reset) setFilter(defaultValues);
    }

    const handleChangePage = page => {
        setFilter({page:page});
        handleSearch();
    }

    const handleChangeRowsPerPage = (newPerPage,page) => {
        setFilter({page:page,results:newPerPage});
        handleSearch();
    }

    const handleSort = (column, sortDirection) => {
        console.log(column?.id, sortDirection);
        setFilter({sortField:column?.id,sortDir:sortDirection});
        handleSearch();
    }

    const handleRowClick = row => {
        accordionViewRef.current.click();
        setSelectedRowId(row.FORM_ID);
    }

    const expandRow = useMemo(()=>((isAdmin && general.showFormWF == 'A')||general.showFormWF == 'Y'),[general,isAdmin]);

    const columns = [
        {id:'form_id',name:'ID',selector:row=>row.FORM_ID,sortable:true},
        {id:'effdate',name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true},
        {id:'fullname',name:'Name',selector:row=>row.sortName,sortable:true},
        {id:'payroll_code',name:'Payroll',selector:row=>(
            <DescriptionPopover 
                id={`${row.PAYROLL_CODE}_description`}
                content={row.PAYROLL_DESCRIPTION}
            >
                <p className="mb-0">{row.PAYROLL_TITLE}</p>
            </DescriptionPopover>
        ),sortable:true},
        {id:'form_code',name:'Form',selector:row=>(
            <DescriptionPopover
                id={`${row.FORM_ID}_code_description`}
                content={displayFormCode({variant:"title",separator:" | ",titles:[row.FORM_TITLE,row.ACTION_TITLE,row.TRANSACTION_TITLE]})}
            >
                <p className="mb-0">{displayFormCode({codes:[row.FORM_CODE,row.ACTION_CODE,row.TRANSACTION_CODE]})}</p>
            </DescriptionPopover>
        ),sortable:true},
        {id:'line_number',name:'Line #',selector:row=>row.LINE_NUMBER,sortable:true},
        {id:'benefit_flag',name:'Benefits',selector:row=>row.BENEFIT_FLAG.id,format:row=>`${row.BENEFIT_FLAG.id} - ${row.BENEFIT_FLAG.label}`,sortable:true},
        {id:'created_by_suny_id',name:'Created By',selector:row=>row.CREATED_BY_SUNY_ID,sortable:true,format:row=>`${row.createdByFullName} (${row.CREATED_BY_SUNY_ID})`,wrap:true},
    ];

    const customStyles = {
        subHeader: {
            style: {
                flexDirection: 'column',
                alignItems: 'flex-end',
                padding: '0.25rem 0.75rem 0.5rem',
                border: '1px solid #004333',
                marginBottom: '0.25rem',
                borderRadius: '4px'
            }
        }
    };

    const conditionalRowStyles = [
        {
            when: row => row.FORM_ID == selectedRowId,
            classNames: ['bg-primary-light']
        }
    ];

    useEffect(() => {
        if (!submitted) return;
        listdata.refetch().then(d => {
            for (const r of d.data.results) {
                if (r.CREATED_BY_SUNY_ID) r.createdByFullName = [r.CREATED_BY_FIRST_NAME,r.CREATED_BY_LEGAL_LAST_NAME].join(' ');
                r.fullName = [r.FIRST_NAME,r.LEGAL_LAST_NAME].join(' ');
                r.sortName = [r.LEGAL_LAST_NAME,r.FIRST_NAME].join(', ') + ' ' + (r.LEGAL_MIDDLE_NAME && r.LEGAL_MIDDLE_NAME.slice(0,1));
                r.GROUPS_ARRAY = (!r.GROUPS)?[]:r.GROUPS.split(',').map(g=>pick(find(groups.data,{GROUP_ID:g}),['GROUP_ID','GROUP_NAME','GROUP_DESCRIPTION']));
            }
            setData(d.data.results);
            setTotalRows(d.data.info.total_rows);
            setSubmitted(false);
        });
    },[filter,submitted,groups,listdata]);

    if (listdata.isError) return <Loading type="alert" isError>Error Loading List Data</Loading>;
    return (
        <Accordion defaultActiveKey="0">
            <Card style={{overflow:'visible'}}>
                <Accordion.Toggle as={Card.Header} className="d-print-none" eventKey="0">
                    <h3 className="m-0">Archive Search</h3>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="0">
                    <DataTable 
                        keyField="FORM_ID"
                        defaultSortFieldId={2}
                        defaultSortAsc={false}
                        className="compact"
                        columns={columns} 
                        data={data}
                        noDataComponent={<div className="p-3">{listdata.isFetched?"No Records Found":"Perform A Search"}</div>}
                        persistTableHead
                        progressPending={listdata.isLoading}
                        pagination 
                        paginationServer
                        paginationTotalRows={totalRows}
                        subHeader
                        subHeaderComponent={<ArchiveTableSubHeader filter={filter} setFilter={setFilter} handleSearch={handleSearch} handleReset={handleReset} calculateDates={calculateDates} userData={userData}/>}
                        onChangeRowsPerPage={handleChangeRowsPerPage}
                        onChangePage={handleChangePage}
                        onRowClicked={handleRowClick}
                        striped 
                        responsive
                        pointerOnHover
                        highlightOnHover
                        customStyles={customStyles}
                        conditionalRowStyles={conditionalRowStyles}
                        expandableRows={expandRow}
                        expandableRowsComponent={WorkflowExpandedComponent}
                        sortServer={true}
                        onSort={handleSort}
                    />
                </Accordion.Collapse>
            </Card>
            <Card>
                <Accordion.Toggle ref={accordionViewRef} as={Card.Header} className="d-print-none" eventKey="1">
                    <h3 className="m-0">Archive View</h3>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="1">
                    <Card.Body>
                        {!selectedRowId?<p className="mb-0 text-center">Perform a search and select a row</p>:<ArchiveView formId={selectedRowId}/>}
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion>
    );
}

function ArchiveTableSubHeader({filter,setFilter,handleSearch,handleReset,calculateDates,userData}) {
    const daysButtons = [
        {id: 'btn-days-14', label: '14 Days', value: '14' },
        { id: 'btn-days-30', label: '30 Days', value: '30' },
        { id: 'btn-days-60', label: '60 Days', value: '60' },
        { id: 'btn-days-90', label: '90 Days', value: '90' },
        { id: 'btn-days-custom', label: 'Custom', value: '-1' }
    ];
    const [days,setDays] = useState('btn-days-30');
    const [showFormCodeModal,setShowFormCodeModal] = useState(false);
    const [filteredUsers,setFilteredUsers] = useState(userData);
    const [createdBySearch,setCreatedBySearch] = useState([{id:'',label:''}]);
    const [dateRange,setDateRange] = useState([filter.startDate,filter.endDate]);
    const [startDate,endDate] = dateRange;

    const { getListData } = useListsQueries();
    const { getCodes } = useCodesQueries('payroll');
    const { getCodes:getFormCodes } = useCodesQueries('form');
    const { getCodes:getActionCodes } = useCodesQueries('action');
    const { getCodes:getTransactionCodes } = useCodesQueries('transaction');

    const payrollcodes = getCodes({
        refetchOnMount:false,
        select:d=>d.filter(p=>p.ACTIVE==1) // only show active payrolls
    });
    const benefits = getListData('benefitCodes');
    const formCodes = getFormCodes();
    const actionCodes = getActionCodes();
    const transactionCodes = getTransactionCodes();

    const handleDaysChange = e => {
        setDays(e.target.id);
        const daysObj = calculateDates({days:daysButtons.find(d=>d.id === e.target.id)?.value||0});
        setDateRange([daysObj.startDate,daysObj.endDate]);
        setFilter({days:daysObj.days});
        handleReset(false);
    }

    const handleDateChange = range => { 
        setDateRange(range);
        if (!!range[0]&&!!range[1]) setFilter({startDate:range[0], endDate:range[1]});
    }

    const handleFilterChange = e => {
        const obj = {};
        obj[e.target.id] = e.target.value;
        if (e.target.id == 'formId') setCreatedBySearch([{id:'',label:''}]);
        setFilter(obj);
        handleReset(false);
    }

    const clearFormCode = () => {
        setFilter({formCode:'',actionCode:'',transactionCode:''});
    }

    const handlePersonSearch = search => {
        setFilteredUsers(userData.filter(u=>u.label.toLowerCase().includes(search.toLowerCase())));
    }
    const handlePersonSearchChange = value => {
        setCreatedBySearch(value);
        setFilter({createdBy:value[0]?.id});
    }

    const formCodeButtonLabel = useMemo(() => {
        const codes = [filter.formCode,filter.actionCode,filter.transactionCode];
        return (codes.some(c=>!!c)) ? codes.join('-') : 'Select Form Code';
    },[filter]);

    const resetDays = () => {
        setDays('btn-days-30');
        setCreatedBySearch([{id:'',label:''}]);
        handleReset();
    }

    return(
        <Form style={{width:'100%'}}>
            <Form.Row className="justify-content-end">
                <Form.Group as={Col} sm={2} lg={1} controlId="formId">
                    <Form.Label>ID</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.formId} onChange={handleFilterChange}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="personName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.personName} onChange={handleFilterChange}  disabled={filter.formId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="payroll">
                    <Form.Label>Payroll</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.payroll} onChange={handleFilterChange} disabled={filter.formId!=""}>
                        <option></option>
                        {payrollcodes.data && payrollcodes.data.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="formCode">
                    <Form.Label>Form Code</Form.Label>
                    <Form.Control type="button" size="sm" onClick={()=>setShowFormCodeModal(true)} value={formCodeButtonLabel} disabled={filter.formId!=""}/>
                    <Modal show={showFormCodeModal} onHide={()=>setShowFormCodeModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Form Code</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group as={Row}>
                                <Form.Label as={Col} sm={3}>Form Code</Form.Label>
                                <Col sm={9}>
                                    <Form.Control id="formCode" size="sm" as="select" value={filter.formCode} onChange={handleFilterChange}>
                                        <option></option>
                                        {formCodes.data && formCodes.data.map(f=><option key={f.FORM_CODE} value={f.FORM_CODE}>{f.FORM_CODE} - {f.FORM_TITLE}</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label as={Col} sm={3}>Action Code</Form.Label>
                                <Col sm={9}>
                                    <Form.Control id="actionCode" size="sm" as="select" value={filter.actionCode} onChange={handleFilterChange}>
                                        <option></option>
                                        {actionCodes.data && actionCodes.data.map(a=><option key={a.ACTION_CODE} value={a.ACTION_CODE}>{a.ACTION_CODE} - {a.ACTION_TITLE}</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label as={Col} sm={3}>Transaction Code</Form.Label>
                                <Col sm={9}>
                                    <Form.Control id="transactionCode" size="sm" as="select" value={filter.transactionCode} onChange={handleFilterChange}>
                                        <option></option>
                                        {transactionCodes.data && transactionCodes.data.map(t=><option key={t.TRANSACTION_CODE} value={t.TRANSACTION_CODE}>{t.TRANSACTION_CODE} - {t.TRANSACTION_TITLE}</option>)}
                                    </Form.Control>
                                </Col>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="danger" onClick={clearFormCode}>Clear</Button>
                            <Button variant="primary" onClick={()=>setShowFormCodeModal(false)}>Close</Button>
                        </Modal.Footer>
                    </Modal>
                </Form.Group>
                <Form.Group as={Col} sm={2} md={1} controlId="lineNumber">
                    <Form.Label>Line #</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.lineNumber} onChange={handleFilterChange} placeholder="Enter Line #" disabled={filter.formId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="benefitFlag">
                    <Form.Label>Benefits</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.benefitFlag} onChange={handleFilterChange} disabled={filter.formId!=""}>
                        <option></option>
                        {benefits.data && benefits.data.map(b=><option key={b[0]} value={b[0]}>{b[0]} - {b[1]}</option>)}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="createdBy">
                    <Form.Label>Created By</Form.Label>
                    <AsyncTypeahead
                        size="sm"
                        id="createdBy-search"
                        clearButton
                        filterBy={()=>true}
                        onSearch={handlePersonSearch}
                        onChange={handlePersonSearchChange}
                        selected={createdBySearch}
                        minLength={2}
                        flip={true}
                        allowNew={false}
                        options={filteredUsers}
                        placeholder="Search for people..."
                        disabled={filter.formId!=""}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row className="justify-content-end">
                <div className="form-group col-lg-2 col-sm-3 text-right pt-1">Transaction Effective Date:</div>
                <div>
                    <ButtonGroup size="sm" toggle>
                        {daysButtons.map(btn => <Button key={btn.id} id={btn.id} variant={(days==btn.id&&filter.formId=='')?'primary':'secondary'} active={days==btn.id} onClick={handleDaysChange} disabled={filter.formId!=''}>{btn.label}</Button>)}
                    </ButtonGroup>
                </div>
                <Form.Group as={Col} sm={3} lg={2} controlId="customDateRange">
                    <Form.Control 
                        size="sm"
                        as={DatePicker} 
                        name="customDateRange"
                        autoComplete="off"
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={handleDateChange}
                        isClearable={true}
                        placeholderText="Select Custom Date Range"
                        disabled={days!='btn-days-custom'||filter.formId!=''}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row className="justify-content-end">
                <AppButton format="clear" className="mr-2" onClick={resetDays}>Clear</AppButton>
                <AppButton format="search" onClick={handleSearch}>Submit</AppButton>
            </Form.Row>
        </Form>
    );
}
