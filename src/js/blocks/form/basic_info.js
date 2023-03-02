import React, { useState, useEffect, useMemo, useRef, useCallback, useReducer } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useIsFetching } from 'react-query';
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import sub from "date-fns/sub";
import { assign, keyBy, orderBy } from "lodash";
import { AppButton, Loading } from "../components";
import usePersonQueries from "../../queries/person";
import { useCodesQueries, useTransactionQueries } from "../../queries/codes";
import DataTable from 'react-data-table-component';
import { useQueryClient } from "react-query";
import { Icon } from "@iconify/react";
import { defaultFormActions, useHRFormContext } from "../../pages/form";
import { Modal } from "react-bootstrap";

export default function FormBasicInfo() {
    const { getValues } = useFormContext();
    const { infoComplete } = useHRFormContext();

    const watchLookup = useWatch({name:'lookup'});

    const {lookupPerson} = usePersonQueries();
    const results = lookupPerson(watchLookup,{
        enabled:false,
        select:d=>{
            // Add "New Employee" option
            if (!d.results.find(e=>e.id=="")) {
                const newEmp = {};
                d.fields.forEach(k=>newEmp[k]='');
                newEmp.id = 0;
                newEmp.HR_PERSON_ID = '';
                newEmp.EMPLOYMENT_ROLE_TYPE = 'New Employee';
                newEmp.LEGAL_LAST_NAME = 'New Employee';
                d.results.unshift(newEmp);
            }
            //Add "New Role" option for each employee in the list
            const nr = [];
            d.results.forEach(e => {
                if (e.id == "0") return;
                const newRole = {...e};
                e.id = e.HR_PERSON_ID;
                newRole.id = `0_${e.HR_PERSON_ID}_NR`;
                [
                    "LINE_ITEM_NUMBER",
                    "EMPLOYMENT_ROLE_TYPE",
                    "DATA_STATUS_EMP",
                    "STATUS_TYPE",
                    "APPOINTMENT_EFFECTIVE_DATE",
                    "APPOINTMENT_END_DATE",
                    "PAYROLL_AGENCY_CODE",
                    "TITLE_DESCRIPTION",
                    "DPT_CMP_DSC",
                    "APPOINTMENT_TYPE",
                    "APPOINTMENT_PERCENT",
                    "PAY_BASIS",
                    "effectiveDate",
                    "effectiveDateFmt",
                    "endDate",
                    "endDateFmt"
                ].forEach(k=>newRole[k]='');
                nr.push(newRole);
            });
            const result = assign(keyBy(d.results,'id'),keyBy(nr,'id'));
            return orderBy(Object.values(result),['id']);
        }
    });

    if (!infoComplete) return (
        <>
            <PersonLookup results={results}/>
            {results.isLoading && <Loading type="alert" className="mt-2">Searching....</Loading>}
            {results.isError && <Loading type="alert" className="mt-2" isError>Error Searching</Loading>}
            {results.data && <LookupResults data={results.data}/>}

        </>
    );
    return <LookupResults data={[getValues('selectedRow')]}/>;
}

function PersonLookup({results}) {
    const bNumberRef = useRef();

    const { control, getValues, setValue, setFocus, setError, clearErrors, reset, formState:{ errors }} = useFormContext();

    const queryclient = useQueryClient();

    const resetLookup = () => {
        console.debug('resetLookup');
        clearErrors();
        queryclient.resetQueries(['personLookup']);
        reset();
        bNumberRef.current.focus();
    }
    const handleLookup = () => {
        console.debug('handleLookup');
        clearErrors();
        const lookup = getValues(['lookup.type','lookup.values']);
        if (!lookup[0]) { //should not get here - safety valve
            setError('lookup.type',{type:'manual',message:'You must select a lookup option'});
            return;
        }
        if (lookup[0] == 'bNumber' && !lookup[1].bNumber) {
            setError('lookup.values.bNumber',{type:'manual',message:'B-Number is required'});
            return;
        }
        if (lookup[0] == 'lastNameDOB') {
            let hasErrors = false;
            if (!lookup[1].lastName) {
                setError('lookup.values.lastName',{type:'manual',message:'Last Name is required'});
                hasErrors = true;
            }
            if (!lookup[1].dob) {
                setError('lookup.values.dob',{type:'manual',message:'Date of Birth is required'});
                hasErrors = true;
            }
            if (hasErrors) return;
        }
        results.refetch();
    }

    const handleChange = (e,field) => {
        field.onChange(e);
        setFocus((e.target.value == 'lastNameDOB')?'lookup.values.lastName':'lookup.values.bNumber');
    }
    const handleKeyDown = e => e.key=='Escape' && resetLookup();
    const handleLookupKeyDown = e => e.key=='Enter' && handleLookup(e);
    
    const handleFocus = e => {
        //setValue('selectedRow',{});
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

    return (
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
                        render={({field})=><Form.Control {...field} ref={bNumberRef} type="text" onFocus={handleFocus}  onKeyDown={handleLookupKeyDown} isInvalid={errors.lookup?.values?.bNumber} autoFocus/>}
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
                    <InputGroup>
                        <Controller
                            name="lookup.values.dob"
                            defaultValue=""
                            control={control}
                            render={({field})=><Form.Control 
                                as={DatePicker} 
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
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
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
    );
}

function LookupResults({data}) {
    const { setValue } = useFormContext();
    const { infoComplete } = useHRFormContext();

    const [selectedId,setSelectedId] = useState((infoComplete)?data[0].id:undefined);
    const [selectedRow,setSelectedRow] = useState({});

    const handleRowClick = useCallback(row => {
        if (infoComplete) return false;
        setSelectedId((selectedId==row.id)?undefined:row.id);
    },[selectedId]);
    const handleSelectedRowChange = args => {
        const id = (args.selectedCount)?args.selectedRows[0]?.id:undefined;
        if (selectedRow?.id === id) return false;
        console.debug(`handleSelectedRowChange: ${selectedRow?.id} -> ${id}`);
        setSelectedId(id);
        setSelectedRow((args.selectedCount)?args.selectedRows[0]:{});
        setValue('selectedRow',(args.selectedCount)?args.selectedRows[0]:{});
        setValue('payroll.code',(args.selectedCount)?args.selectedRows[0]?.PAYROLL_AGENCY_CODE:"");
        setValue('payroll.title','');
        setValue('payroll.description','');
        setValue('formActions',defaultFormActions);
        setValue('person.information.HR_PERSON_ID',(args.selectedCount)?args.selectedRows[0]?.HR_PERSON_ID:"");
        setValue('person.information.SUNY_ID',(args.selectedCount)?args.selectedRows[0]?.SUNY_ID:"");
    }

    const rowSelectCritera = row => {
        if (infoComplete) return false;
        return row.id==selectedId;
    }

    const handleKeyDown = useCallback(e => { 
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
            onKeyDown={handleKeyDown}
            {...rest}
            disabled={infoComplete}
        />
    ));

    const columns = useMemo(() => [
        {name:'NYS ID',selector:row=>row.NYS_EMPLID,sortable:true,wrap:true},
        {name:'B-Number',selector:row=>row.LOCAL_CAMPUS_ID,sortable:true,wrap:true},
        {name:'Name',selector:row=>row.sortName,sortable:true,wrap:true},
        {name:'Birth Date',selector:row=>row.birthDateFmt,wrap:true},
        {name:'Role',selector:row=>{
            if (!row.EMPLOYMENT_ROLE_TYPE) return "";
            if (row.EMPLOYMENT_ROLE_TYPE == 'New Role') return 'New Role';
            return `${row.EMPLOYMENT_ROLE_TYPE}/${row.DATA_STATUS_EMP}/${row.STATUS_TYPE}`;
        },sortable:true,wrap:true},
        {name:'Payroll',selector:row=>row.PAYROLL_AGENCY_CODE,sortable:true,wrap:true},
        {name:'Department',selector:row=>row.DPT_CMP_DSC,sortable:true,wrap:true},
        {name:'Title',selector:row=>row.TITLE_DESCRIPTION,sortable:true,wrap:true},
        {name:'Effective Date',selector:row=>row.effectiveDateFmt,sortable:true,wrap:true},
        {name:'End Date',selector:row=>row.endDateFmt,sortable:true,wrap:true}
    ]);

    return (
        <>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">{(!infoComplete)?'Results':'Selected Record'}</Col>
                </Row>
                <Row>
                    <Col>
                        <DataTable 
                            className="compact"
                            keyField="id"
                            columns={columns} 
                            data={data}
                            striped 
                            responsive
                            pointerOnHover={!infoComplete}
                            highlightOnHover={!infoComplete}
                            onRowClicked={handleRowClick}
                            selectableRows
                            selectableRowsHighlight
                            selectableRowsSingle
                            selectableRowsComponent={LookupCheckbox}
                            selectableRowSelected={rowSelectCritera}
                            onSelectedRowsChange={handleSelectedRowChange}
                        />                    
                    </Col>
                </Row>
            </article>
            {selectedId!=undefined&&<PayrollDate selectedId={selectedId} selectedPayroll={selectedRow?.PAYROLL_AGENCY_CODE} selectedRoleType={selectedRow?.EMPLOYMENT_ROLE_TYPE}/>}
        </>
    );
}

function PayrollDate({selectedId,selectedPayroll,selectedRoleType}) {
    const { control, setValue, formState: { errors }} = useFormContext();
    const { infoComplete } = useHRFormContext();

    const watchPayrollDate = useWatch({name:['payroll.code','effDate']});

    //const effDateRef = useRef();
    const [payrollDescription,setPayrollDescription] = useState('');

    const {getCodes} = useCodesQueries('payroll');
    const payrollcodes = getCodes({    
        refetchOnMount:false,
        select:d=>d.filter(p=>p.ACTIVE==1),
        onSuccess:d=>{
            if(selectedPayroll) {
                const payroll = d.find(p=>p.PAYROLL_CODE==selectedPayroll);
                setValue('payroll.title',payroll?.PAYROLL_TITLE);
                setValue('payroll.description',payroll?.PAYROLL_DESCRIPTION);
                setPayrollDescription(payroll?.PAYROLL_DESCRIPTION);
                const hasBenefits = payroll?.ADDITIONAL_INFO?.hasBenefits;
                setValue('employment.position.hasBenefits',!!hasBenefits);
            }
        }
    });

    const handleKeyDown = e => {
        console.log('handlekeyDown');
    }
    const handlePayrollChange = (e,field) => {
        field.onChange(e);
        const title = (payrollcodes.data)?payrollcodes.data.find(p=>p.PAYROLL_CODE==e.target.value)?.PAYROLL_TITLE:'';
        const description = (payrollcodes.data)?payrollcodes.data.find(p=>p.PAYROLL_CODE==e.target.value)?.PAYROLL_DESCRIPTION:'';
        setValue('payroll.title',title);
        setValue('payroll.description',description);
        setValue('formActions',defaultFormActions);
        setPayrollDescription(description);
    }
    useEffect(()=>{
        //TODO: can this be consolidated or moved to a function?
        if (!payrollcodes.data) {
            setValue('payroll.title','');
            setValue('payroll.description','');
            setPayrollDescription('');
        } else {
            if (!infoComplete) return;
            const payroll = payrollcodes.data.find(p=>p.PAYROLL_CODE==selectedPayroll);
            setValue('payroll.title',payroll?.PAYROLL_TITLE);
            setValue('payroll.description',payroll?.PAYROLL_DESCRIPTION);
            setPayrollDescription(payroll?.PAYROLL_DESCRIPTION);
        }
    },[payrollcodes.data,selectedId,selectedPayroll]);
    return (
        <>
            <article className="mt-3" onKeyDown={handleKeyDown}>
                <Row as="header">
                    <Col as="h3">Payroll &amp; Date</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Payroll*:</Form.Label>
                    <Col xs="auto">
                        {payrollcodes.isError && <Loading isError>Error Loading Payrolls</Loading>}
                        {payrollcodes.isLoading && <Loading>Loading Payrolls...</Loading>}
                        {payrollcodes.data &&
                            <Controller
                                name="payroll.code"
                                control={control}
                                defaultValue={selectedPayroll}
                                rules={{required:{value:true,message:'Payroll is required'}}}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" onChange={e=>handlePayrollChange(e,field)} isInvalid={errors.payroll} disabled={selectedPayroll!=''} aria-describedby="payrollDescription">
                                        <option></option>
                                        {payrollcodes.data.map(p=><option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>)}
                                    </Form.Control>
                                )}
                            />
                        }
                        <Form.Control.Feedback type="invalid">{errors.payroll?.message}</Form.Control.Feedback>
                    </Col>
                    {payrollDescription && 
                        <Col xs="auto">
                            <Form.Text id="payrollDescription" muted>{payrollDescription}</Form.Text>
                        </Col>
                    }
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Effective Date*:</Form.Label>
                    <Col xs="auto">
                        <InputGroup>
                            <Controller
                                name="effDate"
                                control={control}
                                rules={{required:{value:true,message:'Effective Date is required'}}}
                                render={({field}) => <Form.Control
                                    as={DatePicker}
                                    name={field.name}
                                    selected={field.value}
                                    closeOnScroll={true}
                                    onChange={field.onChange}
                                    isInvalid={errors.effDate}
                                    autoComplete="off"
                                />}
                            />
                            <InputGroup.Append>
                                <InputGroup.Text>
                                    <Icon icon="mdi:calendar-blank"/>
                                </InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">{errors.effDate?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>
            </article>
            {watchPayrollDate.every(v=>!!v) && <FormActionsWrapper payroll={watchPayrollDate[0]} roleType={selectedRoleType}/>}
        </>
    );
}

function FormActionsWrapper({payroll,roleType}) {
    const filter = (roleType=="New Employee")?"100":(roleType=="New Role")?"010":"001";
    
    const { setValue } = useFormContext();
    const { handleTabs, actionsComplete } = useHRFormContext();
    const [watchFormCode,watchActionCode,watchTransactionCode] = useWatch({name:['formActions.formCode','formActions.actionCode','formActions.transactionCode']});

    const {getPayTrans} = useTransactionQueries(payroll);
    const paytrans = getPayTrans();

    const codes = useMemo(()=>{
            if (!paytrans.data) return new Map();
            const filtered = paytrans.data.filter(c=>c.AVAILABLE_FOR&filter);
            const codeMap = new Map();
            //Build Form Codes:
            filtered.map(f=>{
                return {
                    FORM_CODE:f.FORM_CODE,
                    FORM_TITLE:f.FORM_TITLE,
                    FORM_DESCRIPTION:f.FORM_DESCRIPTION,
                    ACTIONS:new Map()
                };
            }).forEach(f=>f.FORM_CODE&&codeMap.set(f.FORM_CODE,f));
            //Build Action Codes:
            codeMap.forEach(f=>{
                const actionMap = new Map();
                filtered.filter(c=>c.FORM_CODE==f.FORM_CODE).map(a => {
                    return {
                        ACTION_CODE:a.ACTION_CODE,
                        ACTION_TITLE:a.ACTION_TITLE,
                        ACTION_DESCRIPTION:a.ACTION_DESCRIPTION,
                        TRANSACTIONS:new Map()
                    };
                }).forEach(a=>a.ACTION_CODE&&actionMap.set(a.ACTION_CODE,a));
                //f.ACTIONS = Array.from(actionMap.values());
                f.ACTIONS = actionMap;
            });
            //Build Transaction Codes:
            codeMap.forEach(f=>{
                f.ACTIONS.forEach(a=>{
                    const transactionMap = new Map();
                    filtered.filter(c=>c.FORM_CODE==f.FORM_CODE&&c.ACTION_CODE==a.ACTION_CODE).map(t=>{
                        return {
                            TRANSACTION_CODE:t.TRANSACTION_CODE,
                            TRANSACTION_TITLE:t.TRANSACTION_TITLE,
                            TRANSACTION_DESCRIPTION:t.TRANSACTION_DESCRIPTION
                        };
                    }).forEach(t=>t.TRANSACTION_CODE&&transactionMap.set(t.TRANSACTION_CODE,t));
                    //a.TRANSACTIONS = Array.from(transactionMap.values());
                    a.TRANSACTIONS = transactionMap;
                });
            });
            //return Array.from(codeMap.entries());
            return codeMap;
        },[paytrans.data,filter]);

    const getCodes = useCallback(type => {
        const empty = {codes:new Map(),size:0};
        let fcode;
        let acode;
        switch(type) {
            case "form":
                return {codes:codes,size:codes.size};
            case "action":
            case "transaction":
                fcode = codes.get(watchFormCode.FORM_CODE);
                if (!fcode) return empty;
                if (type == 'action') return {codes:fcode.ACTIONS,size:fcode.ACTIONS.size};
                acode = fcode.ACTIONS.get(watchActionCode.ACTION_CODE);
                if (!acode) return empty;
                return {codes:acode.TRANSACTIONS,size:acode.TRANSACTIONS.size};
            default:
                return empty;
        }
    },[codes,watchFormCode,watchActionCode,watchTransactionCode]);

    useEffect(() => {
        if (!paytrans.data) return;
        const formCode = watchFormCode.FORM_CODE;
        const actionCode = watchActionCode.ACTION_CODE;
        const transactionCode = watchTransactionCode.TRANSACTION_CODE;
        let pt;
        console.log(paytrans.data);
        console.log(formCode,actionCode,transactionCode);
        if (!!formCode) {
            if (getCodes('action').size == 0) {
                pt = paytrans.data.find(p=>p.AVAILABLE_FOR&filter&&p.FORM_CODE==formCode);
            } else {
                if (!!actionCode) {
                    if (getCodes('transaction').size == 0) {
                        pt = paytrans.data.find(p=>p.AVAILABLE_FOR&filter&&p.FORM_CODE==formCode&&p.ACTION_CODE==actionCode);
                    } else {
                        if (!!transactionCode) {
                            pt = paytrans.data.find(p=>p.AVAILABLE_FOR&filter&&p.FORM_CODE==formCode&&p.ACTION_CODE==actionCode&&p.TRANSACTION_CODE==transactionCode);
                        }
                    }
                }
            }
        }
        if (pt) {
            if (!actionsComplete) {
                console.log(pt.TABS);
                setValue('formActions.PAYTRANS_ID',pt.PAYTRANS_ID);
                handleTabs(pt.TABS);
            }
        } else {
            setValue('formActions.PAYTRANS_ID',"");
            handleTabs();
        }
    },[paytrans.data,filter,watchFormCode,watchActionCode,watchTransactionCode]);
    
    if (!paytrans.data) return <Loading type="alert">Loading Form Actions...</Loading>;
    if (paytrans.error) return <Loading type="alert" isError>Error Loading Form Actions</Loading>;
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Form Actions</Col>
            </Row>
            <FormActionsFormCode formCodes={codes} description={watchFormCode.FORM_DESCRIPTION}/>
            <FormActionsActionCode actionCodes={getCodes('action').codes} description={watchActionCode.ACTION_DESCRIPTION} formCode={watchFormCode.FORM_CODE} actionSize={getCodes('action').size}/>
            <FormActionsTransactionCode transactionCodes={getCodes('transaction').codes} description={watchTransactionCode.TRANSACTION_DESCRIPTION} formCode={watchFormCode.FORM_CODE} actionCode={watchActionCode.ACTION_CODE} actionSize={getCodes('action').size} transactionSize={getCodes('transaction').size}/>
            <p>{getCodes('form').size},{getCodes('action').size},{getCodes('transaction').size}</p>
            <LoadingFormTabs/>
        </article>
    );
}
function FormActionsFormCode({formCodes,description}) {
    const { control, setValue } = useFormContext();
    const { setActionsComplete } = useHRFormContext();

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const code = formCodes.get(e.target.value); 
        const filteredCode = (!code)?defaultFormActions.formCode:Object.keys(code).filter(key=>!['ACTIONS'].includes(key)).reduce((obj,key)=>{
            obj[key]=code[key];
            return obj;
        },{});
        setValue('formActions.PAYTRANS_ID',"");
        setValue('formActions.formCode',filteredCode);
        setValue('formActions.actionCode',defaultFormActions.actionCode);
        setValue('formActions.transactionCode',defaultFormActions.transactionCode);
        setActionsComplete(false);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Form Code:</Form.Label>
            <Col xs="auto">
                <Controller
                    name="formActions.formCode.FORM_CODE"
                    control={control}
                    render={({field}) => (
                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} aria-describedby="formCodeDescription">
                            <option></option>
                            {Array.from(formCodes.values()).map(f=><option key={f.FORM_CODE} value={f.FORM_CODE}>{f.FORM_TITLE}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
            <Col xs="auto">
                <Form.Text id="formCodeDescription" className="mt-2" muted>{description}</Form.Text>
            </Col>
        </Form.Group>
    );
}
function FormActionsActionCode({actionCodes,description,formCode,actionSize,noActions}) {
    const { control, setValue } = useFormContext();
    const { setActionsComplete } = useHRFormContext();

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const code = actionCodes.get(e.target.value); 
        const filteredCode = (!code)?defaultFormActions.actionCode:Object.keys(code).filter(key=>!['TRANACTIONS'].includes(key)).reduce((obj,key)=>{
            obj[key]=code[key];
            return obj;
        },{});
        setValue('formActions.PAYTRANS_ID',"");
        setValue('formActions.actionCode',filteredCode);
        setValue('formActions.transactionCode',defaultFormActions.transactionCode);
        setActionsComplete(false);
    }
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Action Code:</Form.Label>
            <Col xs="auto">
                {(!formCode)?<p>Select a Form Code</p>:
                (actionSize==0)?<p>N/A</p>:
                    <Controller
                        name="formActions.actionCode.ACTION_CODE"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} aria-describedby="actionCodeDescription">
                                <option></option>
                                {Array.from(actionCodes.values()).map(a=><option key={a.ACTION_CODE} value={a.ACTION_CODE}>{a.ACTION_TITLE}</option>)}
                            </Form.Control>
                        )}
                    />
            }
            </Col>
            <Col xs="auto">
                <Form.Text id="actionCodeDescription" className="mt-2" muted>{description}</Form.Text>
            </Col>
        </Form.Group>
    );    
}
function FormActionsTransactionCode({transactionCodes,description,formCode,actionCode,actionSize,transactionSize}) {
    const { control, setValue } = useFormContext();
    const { setActionsComplete } = useHRFormContext();

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const code = transactionCodes.get(e.target.value); 
        setValue('formActions.PAYTRANS_ID',"");
        setValue('formActions.transactionCode',(!code)?defaultFormActions.transactionCode:code);
        setActionsComplete(false);
    }
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Transaction Code:</Form.Label>
            <Col xs="auto">
                {(!formCode)?<p>Select a Form Code</p>:
                (actionSize==0)?<p>N/A</p>:
                (!actionCode)?<p>Select an Action Code</p>:
                (transactionSize==0)?<p>N/A</p>:
                    <Controller
                        name="formActions.transactionCode.TRANSACTION_CODE"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} aria-describedby="transactionCodeDescription">
                                <option></option>
                                {Array.from(transactionCodes.values()).map(t=><option key={t.TRANSACTION_CODE} value={t.TRANSACTION_CODE}>{t.TRANSACTION_TITLE}</option>)}
                            </Form.Control>
                        )}
                    />
                }
            </Col>
            <Col xs="auto">
                <Form.Text id="transactionCodeDescription" className="mt-2" muted>{description}</Form.Text>
            </Col>
        </Form.Group>
    );    
}

function LoadingFormTabs() {
    const isFetchingPerson = useIsFetching(['personInfo']);
    const isFetchingEmployment = useIsFetching(['employmentInfo']);
    return (
        <Modal show={(isFetchingPerson+isFetchingEmployment)>0}>
            <Row>
                <Col>
                    <p className="m-0 p-4 lead"><Icon icon="mdi:loading" className="spin iconify-inline"/> Loading Form Data...</p>
                </Col>
            </Row>
        </Modal>
    );
}
