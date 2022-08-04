import React, { useState, useCallback, useMemo, useReducer, useEffect } from "react";
import { useCodesQueries } from "../../../queries/codes";
import { startCase, toUpper } from "lodash";
import DataTable from 'react-data-table-component';
import { Row, Col, Form, Modal, Alert, OverlayTrigger, Popover } from "react-bootstrap";
import { AppButton, errorToast, ModalConfirm } from "../../components";
import { useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";

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
    
    const queryclient = useQueryClient();
    const {getCodes,patchCodes,deleteCodes} = useCodesQueries(tab,changedRow.code);
    const codes = getCodes();
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

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="delete" size="sm" name="delete" onClick={e=>handleRowEvents(e,row)}/>
                </div>
            );
        },ignoreRowClick:true,width:'100px'},
        {name:vars.code.start,selector:row=>row[vars.code.upper],sortable:true},
        {name:vars.title.start,selector:row=>(
            <OverlayTrigger key={`${row[vars.code.upper]}_description`} trigger={['focus','hover']} placement="auto" overlay={
                <Popover id={`${row[vars.code.upper]}_description`}>
                    <Popover.Title>Description</Popover.Title>
                    <Popover.Content>
                        {row[vars.description.upper]}
                    </Popover.Content>
                </Popover>
            }>
                <p className="m-0">{row[vars.title.upper]}</p>
            </OverlayTrigger>
        ),sortable:true},
        {name:'Active',selector:row=><Form.Check aria-label="Active" name="active" id={`active_${row[vars.code.upper]}`} value={row[vars.code.upper]} checked={row.ACTIVE==1} onChange={e=>handleRowEvents(e,row)}/>,sortable:true,ignoreRowClick:true},
        {name:'Order',selector:row=><Form.Control type="number" name="orderby" defaultValue={row.ORDERBY} onBlur={e=>handleRowEvents(e,row)}/>,sortable:true,ignoreRowClick:true}
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
                        setChangedRow({...defaultChangedRow});
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
                        data={codes.data}
                        pagination 
                        striped 
                        responsive
                        highlightOnHover
                        defaultSortFieldId={5}
                        pointerOnHover
                        onRowClicked={handleRowClick}
                        progressPending={codes.isLoading}
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
    const {handleSubmit, control, setFocus, setError, formState:{errors}} = useForm({
        defaultValues:{
            code:selectedRow[vars.code.upper]||'',
            title:selectedRow[vars.title.upper]||'',
            active:((selectedRow.ACTIVE||1)==1)?true:false,
            order:selectedRow.ORDERBY||nextOrder,
            description:selectedRow[vars.description.upper]||''
        }
    });

    const handleFormSubmit = data => {
        console.debug(data);
        //validate data - make sure there is not a duplicate payrollCode
        if (isNew || (selectedRow[vars.code.upper]!=data.code)) {
            const v = codes.filter(c=>c[vars.code.upper]==data.code)
            if (v.length) {
                setError('code',{type:'custom',message:`Duplicate ${vars.code.start}`});
                setFocus('code');
                setStatus({state:'error',message:<p className="m-0">The {vars.code.start} <strong>{data.code}</strong> already exists.</p>});
                return;
            }
        }
        const d = {
            CODE:data.code,
            TITLE:data.title,
            ACTIVE:(data.active)?'1':'0',
            ORDERBY:(data.order)?data.order:nextOrder,
            DESCRIPTION:data.description
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

    useEffect(()=>setFocus('code'),[]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <Form onSubmit={handleSubmit(handleFormSubmit,handleError)}>
                <Modal.Header closeButton>
                    <Modal.Title>{vars.code.start}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                        </Col>
                    </Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="code">
                            <Form.Label>{vars.code.start}:</Form.Label>
                            <Controller
                                name="code"
                                control={control}
                                defaultValue={selectedRow[vars.code.upper]}
                                rules={{required:{value:true,message:`${vars.code.start} is required`}}}
                                render={({field}) => <Form.Control {...field} type="text" maxLength="10" placeholder={`Enter ${vars.code.start}`} isInvalid={errors.code}/>}
                            />
                            <Form.Control.Feedback type="invalid">{errors.code?.message}</Form.Control.Feedback>
                        </Form.Group>
                    </Form.Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="title">
                            <Form.Label>{vars.title.start}:</Form.Label>
                            <Controller
                                name="title"
                                control={control}
                                defaultValue={selectedRow[vars.title.upper]}
                                rules={{required:{value:true,message:`${vars.title.start} is required`}}}
                                render={({field}) => <Form.Control {...field} type="text" placeholder="Enter a Title" isInvalid={errors.title}/>}
                            />
                            <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
                        </Form.Group>
                    </Form.Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="description">
                            <Form.Label>{vars.description.start}:</Form.Label>
                            <Controller
                                name="description"
                                control={control}
                                defaultValue={selectedRow[vars.description.upper]}
                                render={({field}) => <Form.Control {...field} as="textarea" rows={4} placeholder="Enter a Description (optional)"/>}
                            />
                        </Form.Group>
                    </Form.Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="active">
                            <Form.Label>Active:</Form.Label>
                            <Controller
                                name="active"
                                control={control}
                                defaultValue={selectedRow?.ACTIVE}
                                render={({field}) => <Form.Check {...field} type="checkbox" checked={field.value}/>}
                            />
                        </Form.Group>
                    </Form.Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="order">
                            <Form.Label>Order:</Form.Label>
                            <Controller
                                name="order"
                                control={control}
                                defaultValue={selectedRow?.ORDERBY}
                                render={({field}) => <Form.Control {...field} type="number"/>} 
                            />
                        </Form.Group>
                    </Form.Row>
                </Modal.Body>
                <Modal.Footer>
                    <AppButton format="cancel" variant="secondary" onClick={closeModal}>Cancel</AppButton>
                    {(status.state=='saving')?
                        <AppButton format="saving" variant="danger" disabled>Saving...</AppButton>:
                        <AppButton type="submit" variant="danger" format="save">Save</AppButton>
                    }
                </Modal.Footer>
            </Form>
        </Modal>
    );
}