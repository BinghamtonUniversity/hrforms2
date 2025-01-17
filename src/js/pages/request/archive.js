import React, { useState, useReducer } from "react";
import useRequestQueries from "../../queries/requests";
import { Row, Col, Form, Button, ButtonGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { format, endOfToday, subDays } from "date-fns";
import DataTable from 'react-data-table-component';
import { AppButton, Loading } from "../../blocks/components";
import useListsQueries from "../../queries/lists";

const defaultValues = {
    days:30,
    startDate:null,
    endDate:null,
    reqId:'',
    posType:'',
    reqType:'',
    candidateName:'',
    lineNumber:'',
    createdBy:''
};

export default function ListArchiveTable() {
    //const {general} = useSettingsContext();
    const [data,setData] = useState([]);
    const [page,setPage] = useState(1);
    const [results,setResults] = useState(10);
    const [submitted,setSubmitted] = useState(false);

    const {getArchiveRequestList} = useRequestQueries();
    const listdata = getArchiveRequestList({page:page,results:results});

    const calculateDates = args => {
        const obj = {...args};
        if (args.days>0) {
            obj.endDate = endOfToday();
            obj.startDate = subDays(obj.endDate, parseInt(args.days)+1);
        }
        return obj;
    }

    const [filter,setFilter] = useReducer((state,action) => {
        //console.log(action);
        const dates = calculateDates(action);
        //console.log(dates);
        const newState = {...state, ...action,...dates};
        //console.log(newState);
        return newState;
    },defaultValues,calculateDates);

    const handleSearch = () => {
        const data = {...filter};
        data.startDate = filter.startDate ? format(filter.startDate,'dd-MMM-yyyy') : '';
        data.endDate = filter.startDate ? format(filter.endDate,'dd-MMM-yyyy') : '';
        listdata.mutateAsync(data).then(d => {
            for (const r of d.results) {
                if (r.CREATED_BY_SUNY_ID) {
                    const fName = (r?.ALIAS_FIRST_NAME)?r.ALIAS_FIRST_NAME:(r?.LEGAL_FIRST_NAME)?r.LEGAL_FIRST_NAME:'';
                    r.fullName = (fName)?`${fName} ${r.LEGAL_LAST_NAME}`:'';
                }
            }
            setData(d.results);
            setSubmitted(true);
        });
    }

    const handleReset = () => {
        setSubmitted(false);
        setData(undefined);
        setFilter(defaultValues);
    }

    const columns = [
        {name:'ID',selector:row=>row.REQUEST_ID,sortable:true},
        {name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
        {name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
        {name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true},
        {name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true,wrap:true},
        {name:'Line #',selector:row=>row.LINENUMBER,sortable:true},
        {name:'Title',selector:row=>row.REQBUDGETTITLE,sortable:true,wrap:true},
        {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS',grow:2},
        {name:'Created By',selector:row=>row.CREATED_BY_SUNY_ID,sortable:true,format:row=>`${row.fullName} (${row.CREATED_BY_SUNY_ID})`,wrap:true},
    ];

    const handleChangePage = page => {
        console.log(page);
        setPage(page);
    }

    const handleChangeRowsPerPage = (newPerPage,page) => {
        console.log(newPerPage,page);
        setPage(page);
        setResults(newPerPage);
    }

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

    if (listdata.isError) return <Loading type="alert" isError>Error Loading List Data</Loading>;
    return (
        <DataTable 
            keyField="REQUEST_ID"
            className="compact"
            columns={columns} 
            data={data}
            noDataComponent={<div className="p-3">{submitted?"No Records Found":"Perform A Search"}</div>}
            persistTableHead
            progressPending={listdata.isPending}
            pagination 
            subHeader
            subHeaderComponent={<ArchiveTableSubHeader filter={filter} setFilter={setFilter} handleSearch={handleSearch} handleReset={handleReset}/>}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            onChangePage={handleChangePage}
            striped 
            responsive
            pointerOnHover
            highlightOnHover
            customStyles={customStyles}
        />
    )
}

function ArchiveTableSubHeader({filter,setFilter,handleSearch,handleReset}) {
    const daysButtons = [
        {id: 'btn-days-14', label: '14 Days', value: '14' },
        { id: 'btn-days-30', label: '30 Days', value: '30' },
        { id: 'btn-days-60', label: '60 Days', value: '60' },
        { id: 'btn-days-90', label: '90 Days', value: '90' },
        { id: 'btn-days-custom', label: 'Custom', value: '-1' }
    ];
    const [days,setDays] = useState('btn-days-30');

    // get position type and request type
    const { getListData } = useListsQueries();
    const posTypes = getListData('posTypes');
    const reqTypes = getListData('reqTypes');

    const handleDaysChange = e => {
        setDays(e.target.id);
        setFilter({days:daysButtons.find(d=>d.id === e.target.id)?.value||''});
    }

    const handleDateChange = range => { setFilter({startDate:range[0], endDate:range[1]});}

    const handleFilterChange = e => {
        const obj = {};
        obj[e.target.id] = e.target.value;
        setFilter(obj);
    }

    const resetDays = () => {
        setDays('btn-days-30');
        handleReset();
    }

    return(
        <Form style={{width:'100%'}}>
            <Row>
                <Col><h3>Archive Search</h3></Col>
            </Row>
            <Form.Row className="justify-content-end">
                <Form.Group as={Col} sm={2} lg={1} controlId="reqId">
                    <Form.Label>ID</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.reqId} onChange={handleFilterChange}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="posType">
                    <Form.Label>Position Type</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.posType} onChange={handleFilterChange} disabled={filter.reqId!=""}>
                        <option></option>
                        {posTypes.data && Object.keys(posTypes.data).map(p=>(<option key={p} value={p}>{p} - {posTypes.data[p]?.title}</option>))}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="reqType">
                    <Form.Label>Request Type</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.reqType} onChange={handleFilterChange} disabled={filter.posType==""}>
                        <option></option>
                        {(reqTypes.data&&filter.posType!="") && reqTypes.data.filter(r=>posTypes.data[filter.posType]?.reqTypes.includes(r[0])).map(r=>(<option key={r[0]} value={r[0]}>{r[0]} - {r[1]}</option>))}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="candidateName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.candidateName} onChange={handleFilterChange} placeholder="Enter Name"  disabled={filter.reqId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={2} lg={1} controlId="lineNumber">
                    <Form.Label>Line #</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.lineNumber} onChange={handleFilterChange} placeholder="Line #"  disabled={filter.reqId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="createdBy">
                    <Form.Label>Created By</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.createdBy} onChange={handleFilterChange} placeholder="Created By"  disabled={filter.reqId!=""}/>
                </Form.Group>
            </Form.Row>
            <Form.Row className="justify-content-end">
                <div>
                    <ButtonGroup size="sm" toggle>
                        {daysButtons.map(btn => <Button key={btn.id} id={btn.id} variant={(days==btn.id&&filter.reqId=='')?'primary':'secondary'} active={days==btn.id} onClick={handleDaysChange} disabled={filter.reqId!=''}>{btn.label}</Button>)}
                    </ButtonGroup>
                </div>
                <Form.Group as={Col} sm={3} lg={2} controlId="customDateRange">
                    <Form.Control 
                        size="sm"
                        as={DatePicker} 
                        name="customDateRange"
                        autoComplete="off"
                        selectsRange={true}
                        startDate={filter.startDate}
                        endDate={filter.endDate}
                        onChange={handleDateChange}
                        isClearable={true}
                        placeholderText="Select Custom Date Range"
                        maxDate={new Date()}
                        disabled={days!='btn-days-custom'||filter.reqId!=''}
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
