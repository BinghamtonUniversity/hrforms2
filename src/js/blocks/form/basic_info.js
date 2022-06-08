import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import sub from "date-fns/sub";
import { assign, keyBy, orderBy } from "lodash";
import { AppButton } from "../components";
import usePersonQueries from "../../queries/person";
import { useCodesQueries, useTransactionQueries } from "../../queries/codes";
import { Loading } from "../../blocks/components";
import DataTable from 'react-data-table-component';
import {SlideDown} from 'react-slidedown';

export default function FormBasicInfo() {
    const dobRef = useRef();
    const [lookupData,setLookupData] = useState();
    const {control,isDraft,getValues,setValue,setError,clearErrors,setFocus,formState:{errors}} = useFormContext();
    const handleLookup = () =>{
        //check to make sure there are values
        const lookup = getValues('lookup');
        clearErrors();
        if (!lookup.type) {
            setError('lookup.type',{type:'manual',message:'You must select a lookup option'});
            return;
        }
        if (lookup.type == 'bNumber' && !lookup.bNumber) {
            setError('lookup.bNumber',{type:'manual',message:'B-Number is required'});
            return;
        }
        if (lookup.type == 'lastNameDOB') {
            let hasErrors = false;
            if (!lookup.lastName) {
                setError('lookup.lastName',{type:'manual',message:'Last Name is required'});
                hasErrors = true;
            }
            if (!lookup.dob) {
                setError('lookup.dob',{type:'manual',message:'Date of Birth is required'});
                hasErrors = true;
            }
            if (hasErrors) return;
        }
        console.log(lookup);
        setLookupData(lookup);
    }
    const resetLookup = () => {
        clearErrors();
        ['lookup.type','lookup.bNumber','lookup.lastName','lookup.dob','payroll','effDate','formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
        setLookupData(undefined);
        setFocus('lookup.bNumber');
    }
    const setLookupType = e => {
        switch(e.target.name) {
            case "lookup.bNumber": setValue('lookup.type','bNumber'); break;
            case "lookup.lastName":
            case "lookup.dob":setValue('lookup.type','lastNameDOB'); break;
            default: setValue('lookupType','');
        }
    }
    const listenForKey = e => {
        if (e.key == 'Tab' && e.target.name == 'lookup.dob') dobRef.current.setOpen(false);
        if (e.key == 'Escape') resetLookup();
        if (e.key == 'Enter') handleLookup();
    }
    return (
        <>
            <article className="mt-3 px-2" onKeyDown={listenForKey}>
                <Row as="header">
                    <Col as="h3">Person Lookup</Col>
                </Row>
                <Form.Group as={Row}>
                    <Col sm={2}>
                        <Controller
                            name="lookup.type"
                            control={control}
                            render={({field})=><Form.Check {...field} type="radio" value="bNumber" label="B-Number:" checked={field.value == 'bNumber'} isInvalid={errors.lookup?.type} tabIndex="-1" />}
                        />
                    </Col>
                    <Col xs="auto">
                        <Controller
                            name="lookup.bNumber"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control {...field} onFocus={setLookupType} type="text" isInvalid={errors.lookup?.bNumber} autoFocus/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.lookup?.bNumber?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Col sm={2}>
                    <Controller
                            name="lookup.type"
                            control={control}
                            render={({field})=><Form.Check {...field} type="radio" value="lastNameDOB" label="Last Name:" checked={field.value == 'lastNameDOB'} isInvalid={errors.lookup?.type} tabIndex="-1"/>}
                        />
                        <Form.Control.Feedback type="invalid" style={{display:(errors.lookup?.type)?'block':'none'}}>{errors.lookup?.type?.message}</Form.Control.Feedback>
                    </Col>
                    <Col xs="auto">
                        <Controller
                            name="lookup.lastName"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control {...field} type="text" onFocus={setLookupType} isInvalid={errors.lookup?.lastName}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.lookup?.lastName?.message}</Form.Control.Feedback>
                    </Col>
                    <Form.Label column xs="auto">Date of Birth:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="lookup.dob"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control 
                                as={DatePicker} 
                                ref={dobRef}
                                name={field.name}
                                closeOnScroll={true} 
                                maxDate={sub(new Date(),{years:15})} 
                                selected={field.value} 
                                onFocus={setLookupType} 
                                onChange={field.onChange} 
                                isInvalid={errors.lookup?.dob}
                            />}
                        />
                        <Form.Control.Feedback type="invalid" style={{display:(errors.lookup?.dob)?'block':'none'}}>{errors.lookup?.dob?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Row as="footer">
                    <Col className="button-group">
                        <AppButton format="search" onClick={handleLookup}>Search</AppButton>
                        <AppButton format="clear" onClick={resetLookup}>Clear</AppButton>
                    </Col>
                </Row>
            </article>
            {lookupData && <LookupResults data={lookupData} resetLookup={resetLookup}/>}
        </>
    );
}

function LookupResults({data,resetLookup}) {
    const [selectedId,setSelectedId] = useState();
    const [selectedRow,setSelectedRow] = useState();
    const columns = useMemo(() => [
        {name:'NYS ID',selector:row=>row.NYS_EMPLID,sortable:true},
        {name:'B-Number',selector:row=>row.LOCAL_CAMPUS_ID,sortable:true},
        {name:'Name',selector:row=>row.sortName,sortable:true},
        {name:'Birth Date',selector:row=>row.birthDateFmt},
        {name:'Role',selector:row=>{
            if (!row.EMPLOYMENT_ROLE_TYPE) return "";
            if (row.EMPLOYMENT_ROLE_TYPE == 'New Role') return 'New Role';
            return `${row.EMPLOYMENT_ROLE_TYPE}/${row.DATA_STATUS_EMP}/${row.STATUS_TYPE}`;
        },sortable:true},
        {name:'Payroll',selector:row=>row.PAYROLL_AGENCY_CODE,sortable:true},
        {name:'Department',selector:row=>row.DPT_CMP_DSC,sortable:true},
        {name:'Title',selector:row=>row.TITLE_DESCRIPTION,sortable:true},
        {name:'Effective Date',selector:row=>row.effectiveDateFmt,sortable:true},
        {name:'End Date',selector:row=>row.endDateFmt,sortable:true}
    ]);
    const handleRowClick = useCallback((row,e)=>setSelectedId(row.HR_PERSON_ID));
    const handleSelectedRowChange = useCallback(({...args})=>{
        if (args.selectedCount == 1) {
            setSelectedId(args.selectedRows[0].HR_PERSON_ID);
            setSelectedRow(args.selectedRows[0]);
        }
    });
    const rowSelectCritera = row=>row.HR_PERSON_ID==selectedId;

    const {lookupPerson} = usePersonQueries();
    const lookup = lookupPerson(data,{
        enabled:false,
        select:d=>{
            // Add "New Employee" option
            if (!d.find(e=>e.HR_PERSON_ID=="0")) d.unshift({
                "HR_PERSON_ID": "0",
                "LINE_ITEM_NUMBER": "",
                "SUNY_ID": "",
                "NYS_EMPLID": "",
                "EMPLOYMENT_ROLE_TYPE": "",
                "DATA_STATUS_EMP": "",
                "STATUS_TYPE": "",
                "APPOINTMENT_EFFECTIVE_DATE": "",
                "APPOINTMENT_END_DATE": null,
                "BIRTH_DATE": "",
                "LEGAL_FIRST_NAME": "",
                "LEGAL_MIDDLE_NAME": "",
                "LEGAL_LAST_NAME": "New Employee",
                "LOCAL_CAMPUS_ID": "",
                "PAYROLL_AGENCY_CODE": "",
                "TITLE_DESCRIPTION": "",
                "DPT_CMP_DSC": ""
            });
            //Add "New Role" option for each employee in the list
            const nr = [];
            d.forEach(e => {
                if (e.HR_PERSON_ID == "0") return;
                nr.push({
                    "HR_PERSON_ID": `0_${e.HR_PERSON_ID}_NR`,
                    "LINE_ITEM_NUMBER": "",
                    "SUNY_ID": e.SUNY_ID,
                    "NYS_EMPLID": e.NYS_EMPLID,
                    "EMPLOYMENT_ROLE_TYPE": "New Role",
                    "DATA_STATUS_EMP": "",
                    "STATUS_TYPE": "",
                    "APPOINTMENT_EFFECTIVE_DATE": "",
                    "APPOINTMENT_END_DATE": null,
                    "BIRTH_DATE": e.BRITH_DATE,
                    "LEGAL_FIRST_NAME": e.LEGAL_FIRST_NAME,
                    "LEGAL_MIDDLE_NAME": e.LEGAL_MIDDLE_NAME,
                    "LEGAL_LAST_NAME": e.LEGAL_LAST_NAME,
                    "LOCAL_CAMPUS_ID": e.LOCAL_CAMPUS_ID,
                    "PAYROLL_AGENCY_CODE": "",
                    "TITLE_DESCRIPTION": "",
                    "DPT_CMP_DSC": ""
                });
            });
            const result = assign(keyBy(d,'HR_PERSON_ID'),keyBy(nr,'HR_PERSON_ID'));
            return orderBy(Object.values(result),['HR_PERSON_ID']);
        }
    });

    const onKeyDown = useCallback(e=>{
        if (e.key == 'Escape') resetLookup();
        if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
            const p = e.target.closest('.rdt_TableRow');
            const s = (e.key=='ArrowDown')?p.nextSibling:p.previousSibling;
            if (s && s.classList.contains('rdt_TableRow')) s.querySelector('input[type="checkbox"][name^="select-row"]').focus()
        }
        if (e.key == ' '||e.key=='Enter') {
            e.preventDefault();
            setSelectedId(e.target.name.replace('select-row-',''));
        }
    });
    const LookupCheckbox = React.forwardRef(({ onClick, ...rest }, ref) => (
        <Form.Check
            type="checkbox"
            ref={ref}
            onClick={onClick}
            onKeyDown={onKeyDown}
            {...rest}
        />
    ));

    useEffect(()=>{
        if (!lookup.data) return;
        const r1 = document.querySelector('[name="select-row-0"]');
        r1&&r1.focus();
    },[lookup.data]);
    useEffect(()=>{lookup.refetch();},[data]);
    return(
        <>
            <article className="mt-3">
                <Row>
                    <Col>
                        {lookup.isError && <Loading type="alert" isError>Error Searching</Loading>}
                        {lookup.isLoading && <Loading type="alert">Searching...</Loading>}
                        {lookup.data && 
                            <DataTable 
                                keyField="HR_PERSON_ID"
                                columns={columns} 
                                data={lookup.data}
                                striped 
                                responsive
                                pointerOnHover
                                highlightOnHover
                                onRowClicked={handleRowClick}
                                selectableRows
                                selectableRowsHighlight
                                selectableRowsSingle
                                selectableRowSelected={rowSelectCritera}
                                selectableRowsComponent={LookupCheckbox}
                                onSelectedRowsChange={handleSelectedRowChange}
                            />                    
                        }
                    </Col>
                </Row>
            </article>
            {selectedRow && <PayrollInfo data={selectedRow}/>}
        </>
    );
}

function PayrollInfo({data}) {
    const [selectedPayroll,setSelectedPayroll] = useState(data.PAYROLL_AGENCY_CODE);
    const {getCodes} = useCodesQueries('payroll');
    const payrollcodes = getCodes();

    const { watch, setValue } = useFormContext();

    useEffect(()=>{
        const watchFields = watch((frmData,{name,type}) => {
            setSelectedPayroll((frmData.payroll&&frmData.effDate)?frmData.payroll:'');
        });
        return () => watchFields.unsubscribe();
    },[watch]);

    useEffect(()=>setValue('payroll',data?.PAYROLL_AGENCY_CODE),[data]);

    return (
        <>
            {payrollcodes.data && <PayrollDateInfo payrollcodes={payrollcodes.data} selectedPayroll={selectedPayroll}/>}
            <SlideDown>
                {selectedPayroll && <FormActions selectedPayroll={selectedPayroll}/>}
            </SlideDown>
        </>
    );
}

function PayrollDateInfo({payrollcodes,selectedPayroll}) {
    const effDateRef = useRef();
    const { control, isDraft, setFocus, formState: { errors } } = useFormContext();
    useEffect(()=>{
        (!selectedPayroll)?setFocus('payroll'):effDateRef.current.setFocus(); //cannot use setFocus because of ref override
    },[selectedPayroll]);
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Payroll &amp; Date</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Payroll*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="payroll"
                        control={control}
                        defaultValue={selectedPayroll}
                        rules={{required:{value:true,message:'Payroll is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.payroll} disabled={!isDraft||selectedPayroll!=''}>
                                <option></option>
                                {payrollcodes.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.payroll?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Effective Date*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="effDate"
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'Effective Date is required'}}}
                        render={({field}) => <Form.Control 
                            as={DatePicker} 
                            ref={effDateRef} 
                            name={field.name}
                            selected={field.value} 
                            closeOnScroll={true} 
                            onChange={field.onChange} 
                            isInvalid={errors.effDate}
                            disabled={!isDraft}
                        />}
                    />
                    <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
        </article>
    );
}

function FormActions({selectedPayroll}) {
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Form Actions</Col>
            </Row>
            <Row>
                <Col>{selectedPayroll}</Col>
            </Row>
        </article>
    );
}

/*** OLD */

function PayrollInfoOLD({data}) {
    const effDateRef = useRef();
    const [showFormActions,setShowFormActions] = useState(false);
    
    const { control, isDraft, setFocus, setValue, watch, formState:{ errors } } = useFormContext();

    const {getCodes} = useCodesQueries('payroll');
    const payrollcodes = getCodes();

    const listenForKey = e => {
        if (e.key == 'Tab' && e.target.name == 'effDate') effDateRef.current.setOpen(false);
        //if (e.key == 'Escape') resetLookup();
    }

    const watchPayroll = useWatch({name:'payroll',control:control});

    const resetCodes = () => ['formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
    useEffect(() => {
        const watchFields = watch((frmData,{name,type}) => {
            if (type == 'change') {
                if (name == 'payroll') resetCodes();
                if (name == 'effDate' && frmData.effDate == '') resetCodes();
            }
            setShowFormActions(frmData.payroll&&frmData.effDate);
        });
        return () => watchFields.unsubscribe();
    },[watch]);
    useEffect(()=>{
        setValue('payroll',data?.PAYROLL_AGENCY_CODE);
        setValue('effDate','');
        resetCodes();
    },[data]);
    useEffect(()=>{
        if (!payrollcodes.data) return;
        if (data?.PAYROLL_AGENCY_CODE) {
            effDateRef.current.setFocus();//cannot use setFocus because of ref override
        } else {
            setFocus('payroll');
        }
    },[payrollcodes.data,data]);
    return (
        <>
            <article className="mt-3" onKeyDown={listenForKey}>
                <Row as="header">
                    <Col as="h3">Payroll &amp; Date</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Payroll*:</Form.Label>
                    <Col xs="auto">
                        {payrollcodes.isError && <Loading isError>Failed to load Payrolls</Loading>}
                        {payrollcodes.isLoading && <Loading>Loading Payrolls...</Loading>}
                        {payrollcodes.data && 
                            <Controller
                                name="payroll"
                                defaultValue={data.PAYROLL_AGENCY_CODE}
                                control={control}
                                rules={{required:{value:true,message:'Payroll is required'}}}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" isInvalid={errors.payroll} disabled={!isDraft||data?.PAYROLL_AGENCY_CODE}>
                                        <option></option>
                                        {payrollcodes.data && payrollcodes.data.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
                                    </Form.Control>
                                )}
                            />
                        }
                        <Form.Control.Feedback type="invalid">{errors.payroll?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Effective Date*:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="effDate"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Effective Date is required'}}}
                            render={({field}) => <Form.Control 
                                as={DatePicker} 
                                ref={effDateRef} 
                                name={field.name}
                                selected={field.value} 
                                closeOnScroll={true} 
                                onChange={field.onChange} 
                                isInvalid={errors.effDate} 
                                disabled={!isDraft}
                            />}
                        />
                        <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
            </article>
            <SlideDown>
                {showFormActions && <FormActions payroll={watchPayroll}/>}
            </SlideDown>
        </>
    );
}

function FormActionsOLD({payroll}) {
    const [formCodes,setFormCodes] = useState([]);
    const [actionCodes,setActionCodes] = useState([]);
    const [transactionCodes,setTransactionCodes] = useState([]);

    const { control, isDraft, getValues, setFocus, setValue, watch, formState:{ errors } } = useFormContext();

    const watchFormCode = useWatch({name:'formCode',control:control});

    const {getPayTrans} = useTransactionQueries(payroll);
    const paytrans = getPayTrans();

    useEffect(() => {
        if (!paytrans.data) return;
        const formMap = new Map();
        paytrans.data.forEach(p=>formMap.set(p.FORM_CODE,p.FORM_TITLE));
        const formCodeArray = Array.from(formMap.entries());
        setFormCodes(formCodeArray);
        if (formMap.size == 1) {
            setValue('formCode',formCodeArray[0][0]);
        }
        setActionCodes([]);
        setTransactionCodes([]);
    },[paytrans.data]);

    useEffect(() => {
        const watchFields = watch((frmData,{name,type}) => {
            if (type == 'change') {
                if (name == 'formCode') { 
                    if (frmData.formCode) {
                        if (!paytrans.data) return;
                        //TODO: may not have actionCodes; should enable submit
                        const actionMap = new Map();
                        paytrans.data.forEach(p=>p.FORM_CODE==frmData.formCode&&actionMap.set(p.ACTION_CODE,p.ACTION_TITLE));
                        setActionCodes(Array.from(actionMap.entries()));
                    } else {
                        setActionCodes([]);
                        setTransactionCodes([]);
                    }
                }
                if (name == 'actionCode') {
                    if (frmData.actionCode) {
                        if (!paytrans.data) return;
                        const transactionMap = new Map();
                        paytrans.data.forEach(p=>(p.FORM_CODE==frmData.formCode&&p.ACTION_CODE==frmData.actionCode)&&transactionMap.set(p.TRANSACTION_CODE,p.TRANSACTION_TITLE));
                        console.log(transactionMap);
                        setTransactionCodes(Array.from(transactionMap.entries()));
                    } else {
                        setTransactionCodes([]);
                    }
                }
            }
        });
        return () => watchFields.unsubscribe();
    },[watch,paytrans.data]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Form Actions</Col>
            </Row>
            {paytrans.isError && <Row><Col><Loading isError>Failed to load Payroll Transactions</Loading></Col></Row>}
            {paytrans.isLoading && <Row><Col><Loading>Loading Payroll Transactions...</Loading></Col></Row>}
            {paytrans.data && 
                <>
                    <FormActionSelect control={control} errors={errors} name="formCode" title="Form Code" data={formCodes} required/>
                    <SlideDown closed={!watchFormCode}>
                        {actionCodes.length>0&&<FormActionSelect control={control} errors={errors} name="actionCode" title="Action Code" data={actionCodes}/>}
                    </SlideDown>
                    <SlideDown close={!watchFormCode}>
                        {transactionCodes.length>0&&<FormActionSelect control={control} errors={errors} name="transactionCode" title="Transaction Code" data={transactionCodes}/>}
                    </SlideDown>
                </>
            }
        </article>
    );
}

function FormActionSelect({control,errors,name,title,data,required}) {
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>{title}{required&&'*'}:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={name}
                    control={control}
                    render={({field}) => (
                        <Form.Control {...field} as="select" isInvalid={required&&errors[name]}>
                            <option></option>
                            {data.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                        </Form.Control>
                    )}
                />
                {required && <Form.Control.Feedback type="invalid">{errors[name]?.message}</Form.Control.Feedback>}
            </Col>
        </Form.Group>
    );
}

/*
            <Form.Group as={Row}>
                <Form.Label column md={2}>Form Code*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="formCode"
                        control={control}
                        rules={{required:{value:true,message:'Form Code is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.formCode}>
                                <option></option>
                                {formCodes.map(f=><option key={f[0]} value={f[0]}>{f[0]} - {f[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.formCode?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Action Code*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="actionCode"
                        control={control}
                        rules={{required:{value:true,message:'Action Code is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" isInvalid={errors.actionCode}>
                                <option></option>
                                {actionCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.actionCode?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Transaction Code:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="transactionCode"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {transactionCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>

*/