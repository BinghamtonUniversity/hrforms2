import React, { useState, useCallback, useMemo, useReducer, useEffect, useRef } from "react";
import useCodesQueries from "../../../queries/codes";
import { startCase, toUpper } from "lodash";
import DataTable from 'react-data-table-component';
import { Row, Col, Form, Modal, Alert, Tabs, Tab } from "react-bootstrap";
import { AppButton, DescriptionPopover, errorToast, ModalConfirm } from "../../components";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { useForm, Controller, FormProvider, useFormContext } from "react-hook-form";
import { flattenObject } from "../../../utility";
import { useHotkeys } from "react-hotkeys-hook";

export default function CodesTab({tab,tabName}) {
    const vals = {code:`${tab}_code`,title:`${tab}_title`,description:`${tab}_description`};
    const vars = {
        code:{start:startCase(vals.code),upper:toUpper(vals.code)},
        title:{start:startCase(vals.title),upper:toUpper(vals.title)},
        description:{start:startCase(vals.description),upper:toUpper(vals.description)}
    };
    const defaultChangedRow = {update:false,code:null,field:null,value:null}

    const [isNew,setIsNew] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [changedRow,setChangedRow] = useState({...defaultChangedRow});
    
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const searchRef = useRef();

    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });
    useHotkeys('ctrl+alt+n',()=>setIsNew(true),{enableOnTags:['INPUT']});

    const queryclient = useQueryClient();
    const {getCodes,patchCodes,deleteCodes} = useCodesQueries(tab,changedRow.code);
    const codes = getCodes({onSuccess:d=>{
        setRows(d);
        searchRef.current.focus();
    }});
    const updateCode = patchCodes();
    const deleteCode = deleteCodes();

    const handleRowClick = useCallback(row=>setSelectedRow(row),[]);
    const handleRowEvents = useCallback((e,row) => {
        const r = {...defaultChangedRow};
        r.code = row[vars.code.upper];
        r.field = (['path','svg'].includes(e.target.tagName))?e.target.closest('button').name:e.target.name;
        console.debug(row,r);
        switch(r.field) {
            case "delete":
                r.update = true;
                r.value = true;
                setChangedRow(r);
                break;
            case "active":
                r.update = true;
                r.value = e.target.checked;
                setChangedRow(r);
                break;
            case "orderby":
                if (e.target.value == row.ORDERBY) return;
                r.update = true;
                r.value = e.target.value;
                setChangedRow(r);
                break;                
            default:
                return;
        }
    },[vars]);

    const filterComponent = useMemo(() => {
        const handleKeyDown = e => {
            if(e.key=="Escape"&&!filterText) searchRef.current.blur();
        }
        const handleFilterChange = e => {
            if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
            }
        }
        return(
            <Form onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown}/>
                    </Col>
                </Form.Group>
            </Form>
        );
    },[filterText]);

    const filteredRows = useMemo(()=>rows.filter(row => Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase())),[rows,filterText]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };

    const columns = useMemo(() => [
        {name:'Actions',id:'actions',cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="delete" size="sm" name="delete" onClick={e=>handleRowEvents(e,row)}/>
                </div>
            );
        },ignoreRowClick:true,width:'100px'},
        {name:vars.code.start,selector:row=>row[vars.code.upper],sortable:true},
        {name:vars.title.start,selector:row=>row[vars.title.upper],cell:row=>(
            <DescriptionPopover 
                id={`${row[vars.code.upper]}_description`} 
                content={row[vars.description.upper]}
                showempty
            >
                <p className="m-0">{row[vars.title.upper]}</p>
            </DescriptionPopover>
        ),sortable:true},
        {name:'Active',selector:row=>row.ACTIVE,cell:row=><Form.Check aria-label="Active" name="active" id={`active_${row[vars.code.upper]}`} value={row[vars.code.upper]} checked={row.ACTIVE==1} onChange={e=>handleRowEvents(e,row)}/>,sortable:true,ignoreRowClick:true},
        {name:'Order',selector:row=>row.ORDERBY,cell:row=><Form.Control type="number" name="orderby" defaultValue={row.ORDERBY} onBlur={e=>handleRowEvents(e,row)}/>,sortable:true,ignoreRowClick:true,sortFunction:(a,b)=>a-b}
    ],[codes.data]);

    const nextOrder = useMemo(() => {
        if (!codes.data || codes.data.length == 0) return 1;
        const maxActive = codes.data.reduce((a,b) => (b.ACTIVE=='1'&(parseInt(a.ORDERBY,10)<parseInt(b.ORDERBY,10))?b:a));
        return parseInt(maxActive.ORDERBY,10)+1;
    },[codes.data]);

    const deleteButtons = {
        close:{
            title:'Cancel',
            callback:() => setChangedRow({...defaultChangedRow})
        },
        confirm:{
            title: 'Delete',
            format: 'delete',
            callback:() => {
                toast.promise(new Promise((resolve,reject) => {
                    deleteCode.mutateAsync().then(()=>{
                        Promise.all([
                            queryclient.refetchQueries(['codes',tab],{exact:true,throwOnError:true}),
                            queryclient.refetchQueries('paytrans',{exact:true,throwOnError:true})
                        ]).then(()=>resolve()).catch(err=>reject(err))
                    }).catch(err=>reject(err)).finally(()=>setChangedRow({...defaultChangedRow}));
                }),{
                    pending: `Deleting ${vars.code.start}`,
                    success: `${vars.code.start} Deleted`,
                    error: errorToast(`Failed to Delete ${vars.code.start}`)
                });
            }
        }
    };

    useEffect(()=>{
        if (!changedRow.update) return;
        let data;
        if (changedRow.field == 'delete') {
            return; //handled by ModalConfirm
        } else {
            if (changedRow.field == 'active') data = {ACTIVE:(changedRow.value)?1:0};
            if (changedRow.field == 'orderby') data = {ORDERBY:changedRow.value};
            toast.promise(new Promise((resolve,reject) => {
                updateCode.mutateAsync(data).then(()=>{
                    queryclient.refetchQueries(['codes',tab],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err))
                }).catch(err=>reject(err)).finally(()=>setChangedRow({...defaultChangedRow}));
            }),{
                pending: `Updating ${vars.code.start}`,
                success: `${vars.code.start} Updated`,
                error: errorToast(`Failed to Update ${vars.code.start}`)
            });
        }
    },[changedRow]);

    return (
        <>
            <Row as="header">
                <Col as="h3">{tabName} <AppButton format="add" onClick={()=>setIsNew(true)}>New</AppButton></Col>
            </Row>
            <Row>
                <Col>
                    <DataTable
                        keyField={vars.code.upper}
                        columns={columns}
                        data={filteredRows}
                        pagination 
                        striped 
                        responsive
                        subHeader
                        subHeaderComponent={filterComponent} 
                        paginationRowsPerPageOptions={[10,20,30,40,50,100]}
                        paginationResetDefaultPage={resetPaginationToggle}
                        paginationComponentOptions={paginationComponentOptions}        
                        highlightOnHover
                        defaultSortFieldId={5}
                        pointerOnHover
                        onRowClicked={handleRowClick}
                        progressPending={codes.isLoading}
                        noDataComponent={<p className="m-3">No {tabName} Found Matching Your Criteria</p>}
                    />  
                </Col>
            </Row>
            <ModalConfirm show={changedRow.field=='delete'} title={`Delete ${vars.code.start}?`} buttons={deleteButtons}>
                <p>Are you sure you want to delete {vars.code.start} <strong>{changedRow.code}</strong>?</p>
                <p className="text-danger"><em>Warning: Any existing Payroll Transaction using this {vars.code.start} will be deleted.</em></p>
            </ModalConfirm>
            {(selectedRow[vars.code.upper]||isNew) && <AddEditCode tab={tab} vars={vars} codes={codes.data} selectedRow={selectedRow} setSelectedRow={setSelectedRow} isNew={isNew} setIsNew={setIsNew} nextOrder={nextOrder}/>}
        </>
    );
}

function AddEditCode({tab,vars,codes,selectedRow,setSelectedRow,isNew,setIsNew,nextOrder}) {
    const queryclient = useQueryClient();
    const {postCodes,putCodes} = useCodesQueries(tab,selectedRow[vars.code.upper]);
    const createCode = postCodes();
    const updateCode = putCodes();

    const defaultStatus = {state:'',message:''};
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert'}; break;
            case "saving": presets = {message:'Saving...'}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const closeModal = () => {
        setSelectedRow({});
        setIsNew(false);
    }
    const addlInfoDefaults = useMemo(()=>{
        switch (tab) {
            case "payroll": return selectedRow.ADDITIONAL_INFO;
            default: return {}
        }
    },[tab]);
    const methods = useForm({
        defaultValues:{
            code:selectedRow[vars.code.upper]||'',
            title:selectedRow[vars.title.upper]||'',
            active:((selectedRow.ACTIVE||1)==1)?true:false,
            order:selectedRow.ORDERBY||nextOrder,
            description:selectedRow[vars.description.upper]||'',
            additionalInfo:addlInfoDefaults
        }
    });

    const handleFormSubmit = data => {
        console.debug(data);
        //validate data - make sure there is not a duplicate payrollCode
        if (isNew || (selectedRow[vars.code.upper]!=data.code)) {
            const v = codes.filter(c=>c[vars.code.upper]==data.code)
            if (v.length) {
                methods.setError('code',{type:'custom',message:`Duplicate ${vars.code.start}`});
                methods.setFocus('code');
                setStatus({state:'error',message:<p className="m-0">The {vars.code.start} <strong>{data.code}</strong> already exists.</p>});
                return;
            }
        }
        const d = {
            CODE:data.code,
            TITLE:data.title,
            ACTIVE:(data.active)?'1':'0',
            ORDERBY:(data.order)?data.order:nextOrder,
            DESCRIPTION:data.description,
            ADDITIONAL_INFO:data.additionalInfo
        }
        setStatus({state:'saving',message:''});
        if (isNew) {
            createCode.mutateAsync(d).then(()=>{
                Promise.all([
                    queryclient.refetchQueries(['codes',tab]),
                    queryclient.refetchQueries('paytrans')
                ]).then(()=>{
                    setStatus({state:'clear'});
                    closeModal();
                    toast.success(`${vars.title.start} created successfully`);
                });
            }).catch(e=>{
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            updateCode.mutateAsync(d).then(()=>{
                Promise.all([
                    queryclient.refetchQueries(['codes',tab]),
                    queryclient.refetchQueries('paytrans')
                ]).then(()=>{
                    setStatus({state:'clear'});
                    closeModal();
                    toast.success(`${vars.code.start} updated successfully`);
                });
            }).catch(e=>{
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        }
    }

    const handleError = error => {
        console.error(error);
        let msg = [];
        Object.keys(error).forEach(k => {
            msg.push(<p key={k} className="m-0">{error[k]?.message}</p>);
        });
        setStatus({state:'error',message:msg});
    }

    useEffect(()=>methods.setFocus('code'),[]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleFormSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{vars.code.start}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col>
                                {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                            </Col>
                        </Row>
                        <PayrollTabs tab={tab}>
                            <Form.Row>
                                <Form.Group as={Col} controlId="code">
                                    <Form.Label>{vars.code.start}:</Form.Label>
                                    <Controller
                                        name="code"
                                        control={methods.control}
                                        defaultValue={selectedRow[vars.code.upper]}
                                        rules={{required:{value:true,message:`${vars.code.start} is required`}}}
                                        render={({field}) => <Form.Control {...field} type="text" maxLength="10" placeholder={`Enter ${vars.code.start}`} isInvalid={methods.formState.errors.code} disabled={!isNew}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{methods.formState.errors.code?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Form.Row>
                            <Form.Row>
                                <Form.Group as={Col} controlId="title">
                                    <Form.Label>{vars.title.start}:</Form.Label>
                                    <Controller
                                        name="title"
                                        control={methods.control}
                                        defaultValue={selectedRow[vars.title.upper]}
                                        rules={{required:{value:true,message:`${vars.title.start} is required`}}}
                                        render={({field}) => <Form.Control {...field} type="text" placeholder="Enter a Title" isInvalid={methods.formState.errors.title}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{methods.formState.errors.title?.message}</Form.Control.Feedback>
                                </Form.Group>
                            </Form.Row>
                            <Form.Row>
                                <Form.Group as={Col} controlId="description">
                                    <Form.Label>{vars.description.start}:</Form.Label>
                                    <Controller
                                        name="description"
                                        control={methods.control}
                                        defaultValue={selectedRow[vars.description.upper]}
                                        render={({field}) => <Form.Control {...field} as="textarea" rows={4} placeholder="Enter a Description (optional)"/>}
                                    />
                                </Form.Group>
                            </Form.Row>
                            <Form.Group as={Row} controlId="active">
                                <Form.Label column md={2}>Active:</Form.Label>
                                <Col xs="auto" className="pt-2">
                                    <Controller
                                        name="active"
                                        control={methods.control}
                                        defaultValue={selectedRow?.ACTIVE}
                                        render={({field}) => <Form.Check {...field} type="checkbox" checked={field.value}/>}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="order">
                                <Form.Label column md={2}>Order:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name="order"
                                        control={methods.control}
                                        defaultValue={selectedRow?.ORDERBY}
                                        render={({field}) => <Form.Control {...field} type="number"/>} 
                                    />
                                </Col>
                            </Form.Group>
                        </PayrollTabs>
                    </Modal.Body>
                    <Modal.Footer>
                        <AppButton format="cancel" variant="secondary" onClick={closeModal}>Cancel</AppButton>
                        {(status.state=='saving')?
                            <AppButton format="saving" variant="danger" disabled>Saving...</AppButton>:
                            <AppButton type="submit" variant="danger" format="save">Save</AppButton>
                        }
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

function PayrollTabs({tab,children}) {
    const [activeTab,setActiveTab] = useState('info');
    const navigate = tab=>setActiveTab(tab);
    if (tab != 'payroll') {
        return children;
    } else {
        return (
            <Tabs activeKey={activeTab} onSelect={navigate}>
                <Tab eventKey="info" title="Info" className="ml-1 mt-3">
                    {children}
                </Tab>
                <Tab eventKey="addlInfo" title="Additional Info" className="ml-1 mt-3">
                    <PayrollTabAdditionalInfo/>
                </Tab>
            </Tabs>
        );
    }
}

function PayrollTabAdditionalInfo() {
    const { control } = useFormContext();
    return (
        <section>
            <Form.Group as={Row} controlId="active">
                <Form.Label column md={3}>Has Benefits:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="additionalInfo.hasBenefits"
                        control={control}
                        defaultValue={false}
                        render={({field}) => <Form.Check {...field} type="checkbox" checked={field.value}/>}
                    />
                    <Form.Text muted>Indicates the Payroll Code is allowed benefits</Form.Text>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="active">
                <Form.Label column md={3}>Show Award Amount:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name="additionalInfo.showStudentAwardAmount"
                        control={control}
                        defaultValue={false}
                        render={({field}) => <Form.Check {...field} type="checkbox" checked={field.value}/>}
                    />
                    <Form.Text muted>Indicates the Payroll will display the Student Award Amount in the Existing Pay table on the Pay Tab</Form.Text>
                </Col>
            </Form.Group>
        </section>
    );
}