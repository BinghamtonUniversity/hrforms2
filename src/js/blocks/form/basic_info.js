import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, Collapse } from "react-bootstrap";
import DatePicker from "react-datepicker";
import sub from "date-fns/sub";
import { assign, keyBy, orderBy } from "lodash";
import { AppButton, Loading } from "../components";
import usePersonQueries from "../../queries/person";
import { useCodesQueries, useTransactionQueries } from "../../queries/codes";
import DataTable from 'react-data-table-component';
import { useQueryClient } from "react-query";
import { useLocation } from "react-router-dom";

const name = ""; //TODO: use name variable

export default function FormBasicInfo() {
    const { search } = useLocation();
    const qstr = new URLSearchParams(search);

    const { control, watch, getValues, setValue, setFocus, setError, clearErrors, formState: { errors } } = useFormContext();
    const watchLookup = useWatch({name:'lookup'});
    const watchSelectedRow = useWatch({name:'selectedRow'});
    const watchPayrollDate = useWatch({name:['payroll','effDate']});
    const watchIsNew = useWatch({name:'isNew'});
    const watchFormCode = useWatch({name:'formCode'});
    const watchActionCode = useWatch({name:'actionCode'});
    const watchTransactionCode = useWatch({name:'transactionCode'});

    const dobRef = useRef();
    const effDateRef = useRef();
    const payrollRef = useRef();

    const [showResults,setShowResults] = useState(!getValues('isNew'));
    const [showPayrollDate,setShowPayrollDate] = useState(!getValues('isNew'));
    const [showFormActions,setShowFormActions] = useState(!getValues('isNew'));

    const [selectedId,setSelectedId] = useState();
    const [payrollDescription,setPayrollDescription] = useState('');
    const [formCodes,setFormCodes] = useState([]);
    const [formCodeDescription,setFormCodeDescription] = useState('');
    const [actionCodes,setActionCodes] = useState('Select an Action Code');
    const [actionCodeDescription,setActionCodeDescription] = useState('');
    const [transactionCodes,setTransactionCodes] = useState('Select a Transaction Code');
    const [transactionCodeDescription,setTransactionCodeDescription] = useState('');

    const queryclient = useQueryClient();

    const handleChange = (e,field) => {
        field.onChange(e);
        setFocus((e.target.value == 'lastNameDOB')?'lookup.values.lastName':'lookup.values.bNumber');
    }
    const handleKeyDown = e => e.key=='Escape' && resetLookup();
    const handleLookupKeyDown = e => e.key=='Enter' && handleLookup(e);
    
    const handleFocus = e => {
        setShowResults(false);
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

    const {getCodes} = useCodesQueries('payroll');
    const payrollcodes = getCodes({refetchOnMount:false});

    const {getPayTrans} = useTransactionQueries(watchPayrollDate[0]);
    const paytrans = getPayTrans({enabled:false});

    const {lookupPerson} = usePersonQueries();
    const results = lookupPerson(watchLookup,{
        enabled:false,
        select:d=>{
            // Add "New Employee" option
            if (!d.find(e=>e.HR_PERSON_ID=="0")) d.unshift({
                "HR_PERSON_ID": "0",
                "LINE_ITEM_NUMBER": "",
                "SUNY_ID": "",
                "NYS_EMPLID": "",
                "EMPLOYMENT_ROLE_TYPE": "New Employee",
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
                    "HR_PERSON_ID": `0_${e.HR_PERSON_ID}_NR`, // prefix 0_ for sorting purposes; new role before existing record
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
    const handleTableKeyDown = useCallback(e => { 
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
            onKeyDown={handleTableKeyDown}
            {...rest}
            disabled={!watchIsNew}
        />
    ));
    const resetLookup = () => {
        console.debug('resetLookup');
        setShowResults(false);
        setShowPayrollDate(false);
        queryclient.resetQueries('personLookup');
        queryclient.resetQueries('paytrans');
        setSelectedId(null);
        setActionCodes('Select an Action Code');
        setTransactionCodes('Select a Transaction Code');
        clearErrors();
        ['lookup.values.bNumber','lookup.values.lastName','lookup.values.dob','payroll','effDate','formCode','actionCode','transactionCode','person.info.sunyId','person.info.bNumber','person.info.firstName','person.info.middleName','person.info.lastName','person.demographics.DOB'].forEach(f=>setValue(f,''));
        setValue('lookup.type','bNumber');
        setValue('selectedRow',{});
        setFocus('lookup.values.bNumber');
    }
    const handleLookup = e => {
        e.preventDefault();
        setShowResults(false);
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
        setShowResults(true);
        results.refetch().then(()=>{
            const rows = document.querySelectorAll('[name^="select-row"]');
            rows&&rows[0].focus();    
        });
    }
    const handleRowClick = useCallback(row => {
        if (!watchIsNew) return;
        setSelectedId((selectedId==row.HR_PERSON_ID)?null:row.HR_PERSON_ID);
    },[selectedId]);
    const handleSelectedRowChange = useCallback(args =>{
        if (!results.data) return;
        if (!watchIsNew) return;
        if (watchSelectedRow?.HR_PERSON_ID == args.selectedRows[0]?.HR_PERSON_ID) return;
        console.debug('handleSelectedRowChange');
        ['formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
        if (args.selectedCount == 1) {
            setValue('selectedRow',args.selectedRows[0]);
            setValue('payroll',args.selectedRows[0]?.PAYROLL_AGENCY_CODE);
            setValue('person.info.sunyId',args.selectedRows[0]?.SUNY_ID);
            setValue('person.info.bNumber',args.selectedRows[0]?.LOCAL_CAMPUS_ID);
            setValue('person.info.firstName',args.selectedRows[0]?.LEGAL_FIRST_NAME);
            setValue('person.info.middleName',args.selectedRows[0]?.LEGAL_MIDDLE_NAME);
            setValue('person.info.lastName',args.selectedRows[0]?.LEGAL_LAST_NAME);
            setValue('person.demographics.DOB',args.selectedRows[0]?.birthDate);
            setSelectedId(args.selectedRows[0].HR_PERSON_ID);
            setShowPayrollDate(true);
            // Set focus on payroll if there is no payroll on the selected row; uses the DatePicker setFocus function, not native JS .focus()
            (args.selectedRows[0].PAYROLL_AGENCY_CODE=="")?payrollRef.current.focus():effDateRef.current.setFocus();
        } else {
            setValue('selectedRow',{});
            ['payroll','person.info.sunyId','person.info.bNumber','person.info.firstName','person.info.middleName','person.info.lastName','person.demographics.DOB'].forEach(f=>setValue(f,''));
            setSelectedId(null);
            setShowPayrollDate(false);
        }
    },[results]);
    const rowSelectCritera = row => {
        if (!watchIsNew) return true;
        return row.HR_PERSON_ID==selectedId;
    }

    const handlePayrollChange = (e,field) => {
        field.onChange(e);
        if (!watchIsNew) return;
        ['formCode','actionCode','transactionCode'].forEach(f=>setValue(f,''));
        setFormCodes([]);
        setActionCodes('Select an Action Code');
        setTransactionCodes('Select a Transaction Code');
    }
    useEffect(()=>{
        if (payrollcodes.data) {
            const payrollInfo = payrollcodes.data.find(p=>p.PAYROLL_CODE==watchPayrollDate[0]);
            setPayrollDescription(payrollInfo?.PAYROLL_DESCRIPTION);
            setValue('employment.position.hasBenefits',payrollInfo?.ADDITIONAL_INFO?.hasBenefits||false);
            if (!payrollInfo?.ADDITIONAL_INFO?.hasBenefits) setValue('employment.position.benefitsFlag','9');
        }
        if (!watchPayrollDate.every(a=>!!a)) {
            setShowFormActions(false);
        } else {
            setShowFormActions(true);
            paytrans.refetch().then(d => {
                const filter = (watchSelectedRow.EMPLOYMENT_ROLE_TYPE=="New Employee")?"100":(watchSelectedRow.EMPLOYMENT_ROLE_TYPE=="New Role")?"010":"001";
                const formCodesMap = new Map();
                d.data.forEach(p=>(filter & p.AVAILABLE_FOR) && formCodesMap.set(p.FORM_CODE,p.FORM_TITLE));
                setFormCodes(Array.from(formCodesMap.entries()));
            });
        }
    },[watchPayrollDate,payrollcodes.data]);
    useEffect(()=>{
        /*if (getFieldState('formCode').isDirty && getValues('isNew')) {
            console.debug('formCode is dirty',getValues('formCode'));
            ['actionCode','transactionCode'].forEach(f=>setValue(f,''));
            setValue('basicInfoComplete',false);
        }*/
        if (!watchFormCode) {
            setFormCodeDescription('');
            setActionCodes('Select an Action Code');
            setTransactionCodes('Select a Transaction Code');
        } else {
            if (!paytrans.data) return;
            const filter = (watchSelectedRow.EMPLOYMENT_ROLE_TYPE=="New Employee")?"100":(watchSelectedRow.EMPLOYMENT_ROLE_TYPE=="New Role")?"010":"001";
            setFormCodeDescription(paytrans.data.find(p=>(filter&p.AVAILABLE_FOR)&&p.FORM_CODE==watchFormCode)?.FORM_DESCRIPTION);
            const aCodes = Array.from(new Map(paytrans.data.filter(p=>(filter&p.AVAILABLE_FOR)&&p.FORM_CODE==watchFormCode&&p.ACTION_CODE).map(a=>[a.ACTION_CODE,a.ACTION_TITLE])));
            if (!aCodes.length) {
                setActionCodes('N/A');
                setTransactionCodes('N/A');
                setValue('basicInfoComplete',true);
            } else {
                setActionCodes(aCodes);
                setTransactionCodes('Select a Transaction Code');
            }
        }
    },[watchFormCode,paytrans.data]);
    useEffect(()=>{
        if (!watchActionCode){
            setActionCodeDescription('');
            setTransactionCodes('Select a Transaction Code');
        } else {
            if (!paytrans.data) return;
            setActionCodeDescription(paytrans.data.find(p=>p.FORM_CODE==watchFormCode&&p.ACTION_CODE==watchActionCode)?.ACTION_DESCRIPTION);
            const tCodes = Array.from(new Map(paytrans.data.filter(p=>p.FORM_CODE==watchFormCode&&p.ACTION_CODE==watchActionCode&&p.TRANSACTION_CODE).map(t=>[t.TRANSACTION_CODE,t.TRANSACTION_TITLE])));
            if (!tCodes.length) {
                setTransactionCodes('N/A');
                setValue('basicInfoComplete',true);
            } else {
                setTransactionCodes(tCodes);
            }
        }
    },[watchActionCode,paytrans.data]);
    useEffect(() => {
        setValue('basicInfoComplete',!!watchTransactionCode);
        if (!paytrans.data) return;
        setTransactionCodeDescription((!!watchTransactionCode)?paytrans.data.find(p=>p.FORM_CODE==watchFormCode&&p.ACTION_CODE==watchActionCode&&p.TRANSACTION_CODE==watchTransactionCode)?.TRANSACTION_DESCRIPTION:'');
    },[watchTransactionCode,paytrans.data]);
    useEffect(()=>{
        const watchFields = watch((frmData,{name,type}) => {
            if (name == 'formCode' && type == 'change') {
                ['actionCode','transactionCode'].forEach(f=>setValue(f,''));
                setValue('basicInfoComplete',false);
            }
            if (name == 'actionCode' && type == 'change') {
                setValue('transactionCode','');
                setValue('basicInfoComplete',false);
            }
        });
        return () => {
            watchFields.unsubscribe();
            queryclient.invalidateQueries('payroll',{exact:true});
        }
    },[]);
    return (
        <>
            {watchIsNew &&
                <article className="mt-3" onKeyDown={handleKeyDown}>
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
                                control={control}
                                render={({field})=><Form.Control {...field} type="text" onFocus={handleFocus}  onKeyDown={handleLookupKeyDown} isInvalid={errors.lookup?.values?.bNumber} autoFocus/>}
                            />
                            <Form.Control.Feedback type="invalid">{errors.lookup?.values?.bNumber?.message}</Form.Control.Feedback>
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
                                render={({field})=><Form.Control {...field} type="text" onFocus={handleFocus} onKeyDown={handleLookupKeyDown} isInvalid={errors.lookup?.values?.lastName}/>}
                            />
                            <Form.Control.Feedback type="invalid">{errors.lookup?.values?.lastName?.message}</Form.Control.Feedback>
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
                                    onKeyDown={handleLookupKeyDown}
                                    isInvalid={errors.lookup?.values?.dob}
                                    autoComplete="off"
                                />}
                            />
                            <Form.Control.Feedback type="invalid" style={{display:(errors.lookup?.values?.dob)?'block':'none'}}>{errors.lookup?.values?.dob?.message}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Row as="footer">
                        <Col className="button-group">
                            <AppButton format="search" onClick={handleLookup}>Search</AppButton>
                            <AppButton format="clear" onClick={resetLookup}>Clear</AppButton>
                        </Col>
                    </Row>
                </article>
            }
            <Collapse in={qstr.has('showall')||showResults}>
                <div>
                    <article className="mt-3">
                        <Row as="header">
                            <Col as="h3">Results</Col>
                        </Row>
                        <Row>
                            <Col>
                                <DataTable 
                                    keyField="HR_PERSON_ID"
                                    columns={columns} 
                                    data={(!watchIsNew)?[getValues('selectedRow')]:results.data}
                                    progressPending={results.isLoading}
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
                            </Col>
                        </Row>
                    </article>
                    <Collapse in={qstr.has('showall')||showPayrollDate}>
                        <div>
                            <article className="mt-3" onKeyDown={handleKeyDown}>
                                <Row as="header">
                                    <Col as="h3">Payroll &amp; Date</Col>
                                </Row>
                                <Form.Group as={Row}>
                                    <Form.Label column md={2}>Payroll*:</Form.Label>
                                    <Col xs="auto">
                                        <Controller
                                            name="payroll"
                                            control={control}
                                            rules={{required:{value:true,message:'Payroll is required'}}}
                                            render={({field}) => (
                                                <Form.Control {...field} as="select" ref={payrollRef} onChange={e=>handlePayrollChange(e,field)} isInvalid={errors.payroll} disabled={watchSelectedRow?.PAYROLL_AGENCY_CODE} aria-describedby="payrollDescription">
                                                    <option></option>
                                                    {payrollcodes.data&&payrollcodes.data.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
                                                </Form.Control>
                                            )}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.payroll?.message}</Form.Control.Feedback>
                                    </Col>
                                    {payrollDescription && <Col xs="auto">
                                        <Form.Text id="payrollDescription" muted>{payrollDescription}</Form.Text>
                                    </Col>}
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
                                                autoComplete="off"
                                            />}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                                    </Col>
                                </Form.Group>
                            </article>
                            <Collapse in={qstr.has('showall')||showFormActions}>
                                <div>
                                    <article className="mt-3">
                                        <Row as="header">
                                            <Col as="h3">Form Actions</Col>
                                        </Row>
                                        <Form.Group as={Row}>
                                            <Form.Label column md={2}>Form Code:</Form.Label>
                                            <Col xs="auto">
                                                {paytrans.isIdle?<p>Waiting for Payroll</p>:paytrans.isLoading?<Loading>Loading Form Codes...</Loading>:
                                                <Controller
                                                    name="formCode"
                                                    control={control}
                                                    render={({field}) => (
                                                        <Form.Control {...field} as="select" isInvalid={errors.formCode} aria-describedby="formCodeDescription">
                                                            <option></option>
                                                            {formCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                                                        </Form.Control>
                                                    )}
                                                />}
                                                <Form.Control.Feedback type="invalid">{errors.formCode?.message}</Form.Control.Feedback>
                                            </Col>
                                            {formCodeDescription && <Col xs="auto">
                                                <Form.Text id="formCodeDescription" muted>{formCodeDescription}</Form.Text>
                                            </Col>}
                                        </Form.Group>
                                        <Form.Group as={Row}>
                                            <Form.Label column md={2}>Action Codes:</Form.Label>
                                            <Col xs="auto">
                                                {(typeof actionCodes == 'string')?
                                                    <p>{actionCodes}</p>:
                                                    <Controller
                                                        name="actionCode"
                                                        control={control}
                                                        render={({field}) => (
                                                            <Form.Control {...field} as="select" aria-describedby="actionCodeDescription">
                                                                <option></option>
                                                                {actionCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                                                            </Form.Control>
                                                        )}
                                                    />
                                                }
                                            </Col>
                                            {actionCodeDescription && <Col xs="auto">
                                                <Form.Text id="actionCodeDescription" muted>{actionCodeDescription}</Form.Text>
                                            </Col>}
                                        </Form.Group>
                                        <Form.Group as={Row}>
                                            <Form.Label column md={2}>Transction Codes:</Form.Label>
                                            <Col xs="auto">
                                                {(typeof transactionCodes == 'string')?
                                                    <p>{transactionCodes}</p>:
                                                    <Controller
                                                        name="transactionCode"
                                                        control={control}
                                                        render={({field}) => (
                                                            <Form.Control {...field} as="select" aria-describedby="transactionCodeDescription">
                                                                <option></option>
                                                                {transactionCodes.map(c=><option key={c[0]} value={c[0]}>{c[0]} - {c[1]}</option>)}
                                                            </Form.Control>
                                                        )}
                                                    />
                                                }
                                            </Col>
                                            {transactionCodeDescription && <Col xs="auto">
                                                <Form.Text id="transactionCodeDescription" muted>{transactionCodeDescription}</Form.Text>
                                            </Col>}
                                        </Form.Group>
                                    </article>
                                </div>
                            </Collapse>
                        </div>
                    </Collapse>
                </div>
            </Collapse>
        </>
    );
}
