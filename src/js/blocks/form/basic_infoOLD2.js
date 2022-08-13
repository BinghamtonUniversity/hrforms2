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

// wrapper
export default function FormBasicInfo() {
    const [showPayrollDate,setShowPayrollDate] = useState(false);
    const [showFormActions,setShowFormActions] = useState(false);

    const { watch, setValue, setFocus, setError, clearErrors } = useFormContext();

    const watchLookup = useWatch({name:'lookup'});

    const handleKeyDown = e => {
        if (e.key == 'Escape') resetLookup();
    }
    const handleLookup = () => {
        setShowFormActions(false);
        setShowPayrollDate(false);
        setValue('lookup.showResults',false);
        clearErrors();
        if (!watchLookup.type) { // should not get here, but just in case
            setError('lookup.type',{type:'manual',message:'You must select a lookup option'});
            return;
        }
        if (watchLookup.type == 'bNumber' && !watchLookup.values.bNumber) {
            setError('lookup.values.bNumber',{type:'manual',message:'B-Number is required'});
            return;
        }
        if (watchLookup.type == 'lastNameDOB') {
            let hasErrors = false;
            if (!watchLookup.values.lastName) {
                setError('lookup.values.lastName',{type:'manual',message:'Last Name is required'});
                hasErrors = true;
            }
            if (!watchLookup.values.dob) {
                setError('lookup.values.dob',{type:'manual',message:'Date of Birth is required'});
                hasErrors = true;
            }
            if (hasErrors) return;
        }
        console.debug(watchLookup);
        setValue('lookup.showResults',true);
    }
    const resetLookup = () => {
        setShowFormActions(false);
        setShowPayrollDate(false);
        setValue('lookup.showResults',false);
        clearErrors();
        ['lookup.values.bNumber','lookup.values.lastName','lookup.values.dob','payroll','effDate','formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
        setValue('lookup.type','bNumber');
        setValue('selectedRow',{});
        setFocus('lookup.values.bNumber');
    }
    useEffect(() => {
        const watchFields = watch((formData,{name,type,values}) => {
            if (name == 'selectedRow') {
                setShowPayrollDate(Object.keys(formData.selectedRow).includes('HR_PERSON_ID'));
            }
            if (!name) { //form reset?
                setShowPayrollDate(formData.lookup.showResults);
            }
            setShowFormActions(!!formData.payroll&&!!formData.effDate);
        });
        return () => watchFields.unsubscribe();
    },[watch]);
    return(
        <div onKeyDown={handleKeyDown}>
            <PersonLookup handleLookup={handleLookup} resetLookup={resetLookup}/>
            {watchLookup.showResults&&<PersonLookupResults lookup={watchLookup}/>}
            {showPayrollDate&&<PayrollAndDate/>}
            {showFormActions&&<FormActions/>}
        </div>
    );
}

function PersonLookup({handleLookup,resetLookup}) {
    const dobRef = useRef();
    const { control, setValue, setFocus, formState: { errors }} = useFormContext();
    const handleKeyDown = e =>{
        if (e.key == 'Tab' && e.target.name == 'lookup.values.dob') dobRef.current.setOpen(false);
        if (e.key == 'Enter') handleLookup();
    }
    const handleChange = (e,field) => {
        field.onChange(e);
        setFocus((e.target.value == 'lastNameDOB')?'lookup.values.lastName':'lookup.values.bNumber');
    }
    const handleFocus = e => {
        setValue('lookup.showResults',false);
        setValue('selectedRow',{});
        switch(e.target.name) {
            case "lookup.values.lastName":
            case "lookup.values.dob":
                setValue('lookup.type','lastNameDOB');
                setValue('lookup.values.bNumber','');
                break;
            default: 
                setValue('lookup.type','bNumber');
                setValue('lookup.values.lastName','');
                setValue('lookup.values.dob','');
            }
    }
    return(
        <article className="mt-3 px-2" onKeyDown={handleKeyDown}>
            <Row as="header">
                <Col as="h3">Person Lookup</Col>
            </Row>
            <Form.Group as={Row}>
                    <Col sm={2}>
                        <Controller
                            name="lookup.type"
                            control={control}
                            render={({field})=><Form.Check {...field} type="radio" id="lookupType-bNumber" value="bNumber" label="B-Number:" checked={field.value=='bNumber'} onChange={e=>handleChange(e,field)} isInvalid={errors.lookup?.type} tabIndex="-1" />}
                        />
                    </Col>
                    <Col xs="auto">
                        <Controller
                            name="lookup.values.bNumber"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control {...field} type="text" onFocus={handleFocus} isInvalid={errors.lookup?.bNumber} autoFocus/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.lookup?.bNumber?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Col sm={2}>
                    <Controller
                            name="lookup.type"
                            control={control}
                            render={({field})=><Form.Check {...field} type="radio" id="lookupType-lastNameDOB" value="lastNameDOB" label="Last Name:" checked={field.value=='lastNameDOB'} onChange={e=>handleChange(e,field)} isInvalid={errors.lookup?.type} tabIndex="-1" />}
                        />
                        <Form.Control.Feedback type="invalid" style={{display:(errors.lookup?.type)?'block':'none'}}>{errors.lookup?.type?.message}</Form.Control.Feedback>
                    </Col>
                    <Col xs="auto">
                        <Controller
                            name="lookup.values.lastName"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control {...field} type="text" onFocus={handleFocus} isInvalid={errors.lookup?.lastName}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.lookup?.lastName?.message}</Form.Control.Feedback>
                    </Col>
                    <Form.Label column xs="auto">Date of Birth:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="lookup.values.dob"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control 
                                as={DatePicker} 
                                ref={dobRef}
                                name={field.name}
                                closeOnScroll={true} 
                                maxDate={sub(new Date(),{years:15})} 
                                selected={field.value} 
                                onChange={field.onChange}
                                onFocus={handleFocus}
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
    );
}
function PersonLookupResults({lookup}) {
    const [selectedId,setSelectedId] = useState(null);

    const { setValue, getValues } = useFormContext();

    const {lookupPerson} = usePersonQueries();
    const results = lookupPerson(lookup,{
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

    const handleRowClick = useCallback(row => {
        setSelectedId((selectedId==row.HR_PERSON_ID)?null:row.HR_PERSON_ID);
    },[selectedId]);

    const handleSelectedRowChange = useCallback(args =>{
        const selectedRow = getValues('selectedRow');
        if (selectedRow?.HR_PERSON_ID == args.selectedRows[0]?.HR_PERSON_ID) return;
        ['formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
        if (args.selectedCount == 1) {
            setValue('selectedRow',args.selectedRows[0]);
            setValue('payroll',args.selectedRows[0]?.PAYROLL_AGENCY_CODE);
            setSelectedId(args.selectedRows[0].HR_PERSON_ID);
        } else {
            setValue('selectedRow',{});
            setValue('payroll','');
            setSelectedId(null);
        }
    },[]);
    const rowSelectCritera = row => row.HR_PERSON_ID==selectedId;

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

    const onKeyDown = useCallback(e=>{
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
        if (!lookup.type) return;
        if (lookup.type == 'bNumber' && !lookup.values.bNumber) return;
        if (lookup.type == 'lastNameDOB' && !(lookup.values.lastName && lookup.values.dob)) return;
        results.refetch();
    },[lookup]);
    useEffect(()=>{
        if (!results.data) return;
        const rows = document.querySelectorAll('[name^="select-row"]');
        rows&&rows[0].focus();
    },[results.data]);
    return(
        <article className="mt-3 px-2">
            <Row as="header">
                <Col as="h3">Results</Col>
            </Row>
            <Row>
                <Col>
                    {results.isError && <Loading type="alert" isError>Error Searching</Loading>}
                    {results.isLoading && <Loading type="alert">Searching...</Loading>}
                    {results.data && 
                        <DataTable 
                            keyField="HR_PERSON_ID"
                            columns={columns} 
                            data={results.data}
                            striped 
                            responsive
                            pointerOnHover
                            highlightOnHover
                            onRowClicked={handleRowClick}
                            selectableRows
                            selectableRowsHighlight
                            selectableRowsSingle
                            selectableRowsComponent={LookupCheckbox}
                            onSelectedRowsChange={handleSelectedRowChange}
                            selectableRowSelected={rowSelectCritera}
                        />                    
                    }
                </Col>
            </Row>
        </article>
    );
}

function PayrollAndDate() {
    const effDateRef = useRef();
    const payrollRef = useRef();

    const { control, formState:{errors} } = useFormContext();
    const watchSelectedRow = useWatch({name:'selectedRow'});

    const {getCodes} = useCodesQueries('payroll');
    const payrollcodes = getCodes();

    const handleKeyDown = e =>{
        if (e.key == 'Tab' && e.target.name == 'effDate') effDateRef.current.setOpen(false);
    }

    useEffect(() => {
        if (!payrollcodes.isSuccess) return;
        (!watchSelectedRow?.PAYROLL_AGENCY_CODE)?payrollRef.current.focus():effDateRef.current.setFocus();
    },[watchSelectedRow,payrollcodes]);
    return(
        <article className="mt-3 px-2" onKeyDown={handleKeyDown}>
            <Row as="header">
                <Col as="h3">Payroll &amp; Date</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Payroll*:</Form.Label>
                <Col xs="auto">
                    {payrollcodes.isLoading?<Loading>Loading Payrolls...</Loading>:
                        <Controller
                            name="payroll"
                            control={control}
                            rules={{required:{value:true,message:'Payroll is required'}}}
                            render={({field}) => (
                                <Form.Control {...field} as="select" ref={payrollRef} isInvalid={errors.payroll} disabled={watchSelectedRow?.PAYROLL_AGENCY_CODE}>
                                    <option></option>
                                    {payrollcodes.data&&payrollcodes.data.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
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
                        />}
                    />
                    <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
        </article>
    );
}

function FormActions() {
    const formCodeRef = useRef();
    const [formCodes,setFormCodes] = useState([]);
    const [actionCodes,setActionCodes] = useState('Select an Action Code');
    const [transactionCodes,setTransactionCodes] = useState('Select a Transaction Code');

    const { control, watch, setValue, setFocus, formState: { errors } } = useFormContext();
    const watchPayroll = useWatch({name:'payroll'});

    const {getPayTrans} = useTransactionQueries(watchPayroll);
    const paytrans = getPayTrans({onSuccess:d=>{
        const formCodesMap = new Map();
        d.forEach(p=>formCodesMap.set(p.FORM_CODE,p.FORM_TITLE));
        setFormCodes(Array.from(formCodesMap.entries()));
    },onError:()=>setFormCodes([]),enabled:false});

    useEffect(()=>paytrans.refetch(),[watchPayroll]);
    useEffect(()=>{
        if (!paytrans.isSuccess) return;
        formCodeRef.current.focus();
    },[paytrans]);
    useEffect(()=>{
        const watchFields = watch((formData,{name}) => {
            if (!paytrans.data) return;
            if (name == 'formCode') {
                ['actionCode','transactionCode'].forEach(f=>setValue(f,''));
                if (!formData.formCode){
                    setActionCodes('Select an Action Code');
                    setTransactionCodes('Select a Transaction Code');
                } else {
                    const aCodes = Array.from(new Map(paytrans.data.filter(t=>t.FORM_CODE==formData.formCode&&t.ACTION_CODE).map(a=>[a.ACTION_CODE,a.ACTION_TITLE])));
                    if (!aCodes) {
                        setActionCodes('N/A');
                        setTransactionCodes('N/A');
                    } else {
                        setActionCodes(aCodes);
                        setTransactionCodes('Select a Transaction Code');    
                    }
                }
            }
            if (name == 'actionCode') {
                setValue('transactionCode','');
                if (!formData.actionCode){
                    setTransactionCodes('Select a Transaction Code');
                } else {
                    const tCodes = Array.from(new Map(paytrans.data.filter(t=>t.FORM_CODE==formData.formCode&&t.ACTION_CODE==formData.actionCode&&t.TRANSACTION_CODE).map(a=>[a.TRANSACTION_CODE,a.TRANSACTION_TITLE])));
                    if (!tCodes) {
                        setTransactionCodes('N/A');
                    } else {
                        setTransactionCodes(tCodes);
                    }
                }
            }
        });
        return () => watchFields.unsubscribe();
    },[watch,paytrans]);

    return (
        <article className="mt-3 px-2">
            <Row as="header">
                <Col as="h3">Form Actions</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Form Code:</Form.Label>
                <Col xs="auto">
                    {(paytrans.isIdle||paytrans.isLoading)?<Loading>Loading Form Actions...</Loading>:
                        <Controller
                            name="formCode"
                            control={control}
                            render={({field}) => (
                                <Form.Control {...field} as="select" ref={formCodeRef} isInvalid={errors.formCode}>
                                    <option></option>
                                    {formCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                    <Form.Control.Feedback type="invalid">{errors.formCode?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <FormActionSelect data={actionCodes} name="actionCode" title="Action Code" control={control}/>
            <FormActionSelect data={transactionCodes} name="transactionCode" title="Transaction Code" control={control}/>
        </article>
    );
}
function FormActionSelect({data,name,title,control}) {
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>{title}:</Form.Label>
            <Col xs="auto">
                {(typeof data == 'string')?
                    <p>{data}</p>:
                    <Controller
                        name={name}
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {data.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
            </Col>
        </Form.Group>
    );
}
