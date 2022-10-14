import React, { useCallback, useEffect, useMemo, useState, useReducer } from "react";
import { Row, Col, Modal, Form, Tabs, Tab, Container, Alert, OverlayTrigger, Popover } from "react-bootstrap";
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form";
import { AppButton, CheckboxTreeComponent, errorToast, ModalConfirm } from "../../components";
import { useTransactionQueries, useCodesQueries } from "../../../queries/codes";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
import { allTabs } from "../../../pages/form";

export default function PayrollTransactionsTab() {
    const [isNew,setIsNew] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [changeRow,setChangeRow] = useState({});

    //need to get ALL the codes
    const {getCodes:getPayrollCodes} = useCodesQueries('payroll');
    const {getCodes:getFormCodes} = useCodesQueries('form');
    const {getCodes:getActionCodes} = useCodesQueries('action');
    const {getCodes:getTransactionCodes} = useCodesQueries('transaction');
    const payrollcodes = getPayrollCodes();
    const formcodes = getFormCodes();
    const actioncodes = getActionCodes();
    const transactioncodes = getTransactionCodes();

    const queryclient = useQueryClient();
    const {getPayTrans,patchPayTrans,deletePayTrans} = useTransactionQueries(changeRow?.PAYTRANS_ID);
    const paytrans = getPayTrans({enabled:payrollcodes.isSuccess&&formcodes.isSuccess&&actioncodes.isSuccess&&transactioncodes.isSuccess});
    const updateActive = patchPayTrans();
    const delpaytrans = deletePayTrans();

    const handleCopyRow = useCallback(row=>{
        const r = {...row}
        r.isCopy = true;
        setSelectedRow(r);
    },[]);

    const handleRowAction = useCallback((action,row) => {
        const r = {...row};
        r.action = action;
        setChangeRow(r);
        console.log(r);
    },[]);
    const handleRowClick = useCallback(row=>setSelectedRow(row),[]);

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="copy" size="sm" name="copy" title="Copy" onClick={()=>handleCopyRow(row)}/>
                    <AppButton format="edit" size="sm" name="edit" title="Edit" onClick={()=>setSelectedRow(row)}/>
                    <AppButton format="delete" size="sm" name="delete" title="Delete" onClick={()=>handleRowAction('delete',row)}/>
                </div>
            );
        },ignoreRowClick:true,width:'150px'},
        {name:"Payroll Code",selector:row=>(
            <OverlayTrigger trigger={['focus','hover']} placement="auto" overlay={
                <Popover id={`${row.PAYTRANS_ID}_payroll_description`}>
                    <Popover.Title>Payroll Description</Popover.Title>
                    <Popover.Content>
                        {row.PAYROLL_DESCRIPTION}
                    </Popover.Content>
                </Popover>
            }>
                <p className="m-0">{row.payrollDisplay}</p>
            </OverlayTrigger>
        ),sortable:true},
        {name:"Form Code",selector:row=>(
            <OverlayTrigger trigger={['focus','hover']} placement="auto" overlay={
                <Popover id={`${row.PAYTRANS_ID}_form_description`}>
                    <Popover.Title>Form Description</Popover.Title>
                    <Popover.Content>
                        {row.FORM_DESCRIPTION}
                    </Popover.Content>
                </Popover>
            }>
                <p className="m-0">{row.formDisplay}</p>
            </OverlayTrigger>
        ),sortable:true},
        {name:"Action Code",selector:row=>(
            <OverlayTrigger trigger={['focus','hover']} placement="auto" overlay={
                <Popover id={`${row.PAYTRANS_ID}_action_description`}>
                    <Popover.Title>Action Description</Popover.Title>
                    <Popover.Content>
                        {row.ACTION_DESCRIPTION}
                    </Popover.Content>
                </Popover>
            }>
                <p className="m-0">{row.actionDisplay}</p>
            </OverlayTrigger>
        ),sortable:true},
        {name:"Trasaction Code",selector:row=>(
            <OverlayTrigger trigger={['focus','hover']} placement="auto" overlay={
                <Popover id={`${row.PAYTRANS_ID}_transaction_description`}>
                    <Popover.Title>Transaction Description</Popover.Title>
                    <Popover.Content>
                        {row.TRANSACTION_DESCRIPTION}
                    </Popover.Content>
                </Popover>
            }>
                <p className="m-0">{row.transactionDisplay}</p>
            </OverlayTrigger>
        ),sortable:true},
        {name:'Active',selector:row=><Form.Check aria-label="Active" name="active" value={row.ACTIVE} checked={row.ACTIVE==1} onChange={()=>handleRowAction('active',row)}/>,sortable:true,ignoreRowClick:true},
    ],[paytrans.data]);

    const deleteButtons = {
        close:{
            title:'Cancel',
            callback:() => setChangeRow({})
        },
        confirm:{
            title: 'Delete',
            format: 'delete',
            callback:() => {
                toast.promise(new Promise((resolve,reject) => {
                    delpaytrans.mutateAsync().then(()=>{
                        setChangeRow({});
                        queryclient.refetchQueries('paytrans',{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err))
                    }).catch(err=>reject(err)).finally(()=>setChangeRow({}));
                }),{
                    pending: 'Deleting Payroll Transaction',
                    success: 'Payroll Transaction Deleted',
                    error: errorToast('Failed to Delete Payroll Transaction')
                });
            }
        }
    };

    useEffect(() => {
        if (changeRow?.action != 'active') return;
        toast.promise(new Promise((resolve,reject) => {
            updateActive.mutateAsync({ACTIVE:(changeRow.ACTIVE=="1"?"0":"1")}).then(()=>{
                console.log('updated');
                queryclient.refetchQueries('paytrans',{exact:true,throwOnError:true}).then(()=>resolve(1)).catch(err=>reject(err))
            }).catch(err=>reject(err)).finally(()=>setChangeRow({}));
        }),{
            pending: 'Updating Payroll Transaction',
            success: 'Payroll Transaction Updated Successfully',
            error: errorToast('Failed to Update Payroll Transaction')
        });
    },[changeRow]);

    return (
        <>
            <Row as="header">
                <Col as="h3">Payroll Transactions <AppButton format="add" onClick={()=>setIsNew(true)}>New</AppButton></Col>
            </Row>
            <Row>
                <Col>
                <DataTable
                        keyField="PAYTRANS_ID"
                        columns={columns}
                        data={paytrans.data}
                        pagination 
                        striped 
                        responsive
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={handleRowClick}
                        progressPending={paytrans.isLoading||paytrans.isIdle}
                    />  
                </Col>
            </Row>
            <ModalConfirm show={changeRow.action=='delete'} title="Delete Payroll Transaction?" buttons={deleteButtons}>Are you sure you wish to delete this Payroll Transaction?</ModalConfirm>
            {(selectedRow.PAYTRANS_ID||isNew) && 
                <AddEditPayTrans 
                    selectedRow={selectedRow} 
                    setSelectedRow={setSelectedRow}
                    paytransdata={paytrans.data}
                    payrollcodes={payrollcodes.data}
                    formcodes={formcodes.data}
                    actioncodes={actioncodes.data}
                    transactioncodes={transactioncodes.data}
                    isNew={isNew}
                    setIsNew={setIsNew}
                />}
        </>
    );
}

function AddEditPayTrans({selectedRow,setSelectedRow,paytransdata,payrollcodes,formcodes,actioncodes,transactioncodes,isNew,setIsNew}) {
    const [activeTab,setActiveTab] = useState('paytrans-info');

    const queryclient = useQueryClient();
    const {postPayTrans,putPayTrans} = useTransactionQueries(selectedRow.PAYTRANS_ID);
    const createPayTrans = postPayTrans();
    const updatePayTrans = putPayTrans();

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

    const methods = useForm({
        defaultValues:{
            PAYROLL_CODE:selectedRow.PAYROLL_CODE||'',
            FORM_CODE:selectedRow.FORM_CODE||'',
            ACTION_CODE:selectedRow.ACTION_CODE||'',
            TRANSACTION_CODE:selectedRow.TRANSACTION_CODE||'',
            ACTIVE:selectedRow.ACTIVE||'1',
            for:{
                newEmpl:(selectedRow?.AVAILABLE_FOR)?selectedRow.AVAILABLE_FOR[0]:0,
                newRole:(selectedRow?.AVAILABLE_FOR)?selectedRow.AVAILABLE_FOR[1]:0,
                curEmpl:(selectedRow?.AVAILABLE_FOR)?selectedRow.AVAILABLE_FOR[2]:0,
            },
            TABS:selectedRow.TABS||[]
        }
    });

    const navigate = tab => setActiveTab(tab);

    const closeModal = () => {
        setSelectedRow({});
        setIsNew(false);
    }

    const handleFormSubmit = data => {
        console.log(data);
        if (isNew || selectedRow.isCopy) {
            const test = paytransdata.find(p=>p.PAYROLL_CODE==data.PAYROLL_CODE&&
                p.FORM_CODE==data.FORM_CODE&&
                p.ACTION_CODE==data.ACTION_CODE&&
                p.TRANSACTION_CODE==data.TRANSACTION_CODE);
            if (test) {
                methods.setError('PAYROLL_CODE',{type:'custom',message:'Duplicate Payroll Transaction'});
                methods.setError('FORM_CODE',{type:'custom',message:'Duplicate Payroll Transaction'});
                methods.setError('ACTION_CODE',{type:'custom',message:'Duplicate Payroll Transaction'});
                methods.setError('TRANSACTION_CODE',{type:'custom',message:'Duplicate Payroll Transaction'});
                methods.setFocus('PAYROLL_CODE');
                methods.setStatus({state:'error',message:'A Payroll Transaction with these values already exists.'});
                return;
            }
        }
        const d = {...data}
        d.ACTIVE = (data.ACTIVE)?1:0;
        d.AVAILABLE_FOR = Object.values(data.for).map(a=>(a==1)?'1':(a==0)?'0':(!!a)?'1':'0').join('');
        delete d['for'];
        delete d['tabs'];
        setStatus({state:'saving',message:''});
        if (isNew||selectedRow.isCopy) {
            createPayTrans.mutateAsync(d).then(()=>{
                queryclient.refetchQueries('paytrans').then(()=>{
                    setStatus({state:'clear'});
                    closeModal();
                    toast.success('Payroll Transaction Created Successfully');
                });
            }).catch(e=>{
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                console.error(e);
            });
        } else {
            //check to see if changes, if none then just exit
            console.log('update',selectedRow,data);
            if ((selectedRow.ACTIVE==1)!=data.ACTIVE||selectedRow.AVAILABLE_FOR!=data.AVAILABLE_FOR) {
                updatePayTrans.mutateAsync(d).then(()=>{
                    queryclient.refetchQueries('paytrans').then(()=>{
                        setStatus({state:'clear'});
                        closeModal();
                        toast.success('Payroll Transaction Updated Successfully');
                    });
                }).catch(e=>{
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                    console.error(e);
                });
            } else {
                setStatus({state:'clear'});
                closeModal();
                toast.info('No Changes to Payroll Transaction');
            }
        }
    }

    const handleError = error => {
        console.error(error);
    }

    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleFormSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{selectedRow.isCopy&&<span>Copy </span>}Payroll Transaction</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Tabs activeKey={activeTab} onSelect={navigate} id="payroll-transaction-tabs">
                            <Tab eventKey="paytrans-info" title="Information">
                                <Container className="mt-3" fluid>
                                    <Row>
                                        <Col>
                                            {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                                        </Col>
                                    </Row>
                                    <PayTransInfoTab 
                                        selectedRow={selectedRow} 
                                        payrollcodes={payrollcodes} 
                                        formcodes={formcodes}
                                        actioncodes={actioncodes}
                                        transactioncodes={transactioncodes}
                                        isEditable={isNew||selectedRow.isCopy}
                                    />
                                </Container>
                            </Tab>
                            <Tab eventKey="paytrans-tabs" title="Tabs">
                                <PayTransTabs selectedTabs={selectedRow?.TABS}/>
                            </Tab>
                        </Tabs>
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

function PayTransInfoTab({selectedRow,payrollcodes,formcodes,actioncodes,transactioncodes,isEditable}) {
    const { control, formState: { errors }} = useFormContext();
    return (
        <>
            <Form.Group as={Row} controlId="PAYROLL_CODE">
                <Form.Label column sm={3}>Payroll Code*:</Form.Label>
                <Col sm={9}>
                    <Controller
                        name="PAYROLL_CODE"
                        control={control}
                        defaultValue={selectedRow.PAYROLL_CODE}
                        rules={{required:{value:true,message:'Payroll Code is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.PAYROLL_CODE} disabled={!isEditable}>
                                <option></option>
                                {payrollcodes && payrollcodes.map(c=>(c.ACTIVE=='1')?<option key={c.PAYROLL_CODE} value={c.PAYROLL_CODE}>{c.PAYROLL_TITLE}</option>:null)}
                            </Form.Control>
                        )}    
                    />
                    <Form.Control.Feedback type="invalid">{errors.PAYROLL_CODE?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="FORM_CODE">
                <Form.Label column sm={3}>Form Code*:</Form.Label>
                <Col sm={9}>
                    <Controller
                        name="FORM_CODE"
                        control={control}
                        defaultValue={selectedRow.FORM_CODE}
                        rules={{required:{value:true,message:'Form Code is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.FORM_CODE} disabled={!isEditable}>
                                <option></option>
                                {formcodes && formcodes.map(c=>(c.ACTIVE=='1')?<option key={c.FORM_CODE} value={c.FORM_CODE}>{c.FORM_CODE} - {c.FORM_TITLE}</option>:null)}
                            </Form.Control>
                        )}    
                    />
                    <Form.Control.Feedback type="invalid">{errors.FORM_CODE?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="ACTION_CODE">
                <Form.Label column sm={3}>Action Code:</Form.Label>
                <Col sm={9}>
                    <Controller
                        name="ACTION_CODE"
                        control={control}
                        defaultValue={selectedRow.ACTION_CODE}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.ACTION_CODE} disabled={!isEditable}>
                                <option></option>
                                {actioncodes && actioncodes.map(c=>(c.ACTIVE=='1')?<option key={c.ACTION_CODE} value={c.ACTION_CODE}>{c.ACTION_CODE} - {c.ACTION_TITLE}</option>:null)}
                            </Form.Control>
                        )}    
                    />
                    <Form.Control.Feedback type="invalid">{errors.ACTION_CODE?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="TRANSACTION_CODE">
                <Form.Label column sm={3}>Transaction Code:</Form.Label>
                <Col sm={9}>
                    <Controller
                        name="TRANSACTION_CODE"
                        control={control}
                        defaultValue={selectedRow.TRANSACTION_CODE}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.TRANSACTION_CODE} disabled={!isEditable}>
                                <option></option>
                                {transactioncodes && transactioncodes.map(c=>(c.ACTIVE=='1')?<option key={c.TRANSACTION_CODE} value={c.TRANSACTION_CODE}>{c.TRANSACTION_CODE} - {c.TRANSACTION_TITLE}</option>:null)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.TRANSACTION_CODE?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="AVAILABLE_FOR">
                <Form.Label column sm={3}>Available For:</Form.Label>
                <Col sm={9} className="pt-2">
                    {[
                        {name:'newEmpl',title:'New Employee'},
                        {name:'newRole',title:'New Role'},
                        {name:'curEmpl',title:'Current Employee'}
                    ].map(r => (
                        <Controller
                            key={r.name}
                            name={`for.${r.name}`}
                            control={control}
                            render={({field}) => <Form.Check {...field} inline type="checkbox" value="1" label={r.title} checked={field.value==1}/>}
                        />
                    ))}
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="ACTIVE">
                <Form.Label column sm={3}>Active:</Form.Label>
                <Col sm={9} className="pt-2">
                    <Controller
                        name="ACTIVE"
                        control={control}
                        defaultValue={selectedRow.ACTIVE}
                        render={({field}) => <Form.Check {...field} type="checkbox" checked={field.value==1}/>}
                    />
                </Col>
            </Form.Group>
        </>
    );
}

function PayTransTabs({selectedTabs}) {
    const { setValue } = useFormContext();

    const [tabsSelected,setTabsSelected] = useState(selectedTabs);
    const [tabsExpanded,setTabsExpanded] = useState(['person','employment']);

    const handleCheck = useCallback(checked=>{
        setTabsSelected(checked);
        setValue('TABS',checked);
    },[]);
    const handleExpand = useCallback(expanded=>setTabsExpanded(expanded),[]);
    return (
        <CheckboxTreeComponent
            id="paytrans-tab-tree"
            nodes={allTabs.filter(t=>!['basic-info','comments','review'].includes(t.value))}
            checked={tabsSelected}
            expanded={tabsExpanded}
            onCheck={handleCheck}
            onExpand={handleExpand}
        />
    )
}