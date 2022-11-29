import React, { useState, useEffect, useMemo, useRef, useCallback, useReducer } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
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
import { defaultFormActions } from "../../pages/form";

export default function FormBasicInfo() {
    const { getValues, isNew } = useFormContext();

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

    return (isNew)?(
        <>
            <PersonLookup results={results}/>
            {results.isLoading && <Loading type="alert" className="mt-2">Searching....</Loading>}
            {results.isError && <Loading type="alert" className="mt-2" isError>Error Searching</Loading>}
            {results.data && <LookupResults data={results.data} isNew={isNew}/>}

        </>
    ):(
        <LookupResults data={[getValues('selectedRow')]} isNew={isNew}/>
    );
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

function LookupResults({data,isNew}) {
    const { setValue } = useFormContext();

    const [selectedId,setSelectedId] = useState((!isNew)?data[0].id:undefined);
    const [selectedRow,setSelectedRow] = useState({});

    const handleRowClick = useCallback(row => {
        if (!isNew) return false;
        setSelectedId((selectedId==row.id)?undefined:row.id);
    },[selectedId]);
    const handleSelectedRowChange = args => {
        const id = (args.selectedCount)?args.selectedRows[0]?.id:undefined;
        if (selectedRow?.id === id) return false;
        console.debug('handleSelectedRowChange: ',id);
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
        if (!isNew) return false;
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
            disabled={!isNew}
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
                    <Col as="h3">{(isNew)?'Results':'Selected Record'}</Col>
                </Row>
                <Row>
                    <Col>
                        <DataTable 
                            keyField="id"
                            columns={columns} 
                            data={data}
                            striped 
                            responsive
                            pointerOnHover={isNew}
                            highlightOnHover={isNew}
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
    const { control, setValue, isNew, formState: { errors }} = useFormContext();

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
            if (!isNew) return;
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
            {watchPayrollDate.every(v=>!!v) && <FormActions payroll={watchPayrollDate[0]} roleType={selectedRoleType}/>}
        </>
    );
}

function FormActions({payroll,roleType}) {
    const filter = (roleType=="New Employee")?"100":(roleType=="New Role")?"010":"001";

    const { control, getValues, setValue, handleTabs, isNew, formState: { errors }} = useFormContext();

    const {getPayTrans} = useTransactionQueries(payroll);
    const paytrans = getPayTrans({enabled:isNew});

    const initCodes = () => {
        if (!isNew) {
            const formActions = {...getValues('formActions')};
            formActions.formCodes = new Map(formActions.formCodes);
            formActions.actionCodes = new Map(formActions.actionCodes);
            formActions.transactionCodes = new Map(formActions.transactionCodes);
            return formActions;
        }
        return {
            formCodes:new Map(),formCode:'',formCodeDescription:'',
            actionCodes:new Map(),actionCode:'',actionCodeDescription:'',
            transactionCodes:new Map(),transactionCode:'',transactionCodeDescription:'',
            paytransId:''
        };
    }
    const [codes,setCodes] = useReducer((state,action) => {
        if (!paytrans.data) return state;
        if (action[0] == 'init') {
            const newState = initCodes();
            newState.formCodes = new Map(paytrans.data.filter(p=>filter&p.AVAILABLE_FOR).map(f=>[f.FORM_CODE,[f.FORM_TITLE,f.FORM_DESCRIPTION]]));
            return newState;
        }
        const [e,field] = action;
        const value = e.target.value;
        const newState = {...state};
        switch(field.name) {
            case "formActions.formCode":
                newState.formCode = value;
                newState.formCodeDescription = (value)?newState.formCodes.get(value)?.at(1):'';
                newState.actionCodes = (value)?new Map(paytrans.data.filter(p=>(filter&p.AVAILABLE_FOR)&&p.FORM_CODE==newState.formCode&&p.ACTION_CODE).map(a=>[a.ACTION_CODE,[a.ACTION_TITLE,a.ACTION_DESCRIPTION]])):new Map();
                newState.actionCode = (value&&!newState.actionCodes.size)?'N/A':'';
                newState.actionCodeDescription = '';
                newState.transactionCodes = new Map();
                newState.transactionCode = (value&&!newState.actionCodes.size)?'N/A':'';
                newState.transactionCodeDescription = '';
                newState.paytransId = (value&&!newState.actionCodes.size)?paytrans.data.filter(p=>(filter&p.AVAILABLE_FOR)&&p.FORM_CODE==newState.formCode)?.at(0)?.PAYTRANS_ID:'';
                break;
            case "formActions.actionCode":
                newState.actionCode = value;
                newState.actionCodeDescription = (value)?newState.actionCodes.get(value)?.at(1):'';
                newState.transactionCodes = (value)?new Map(paytrans.data.filter(p=>p.FORM_CODE==newState.formCode&&p.ACTION_CODE==newState.actionCode&&p.TRANSACTION_CODE).map(t=>[t.TRANSACTION_CODE,[t.TRANSACTION_TITLE,t.TRANSACTION_DESCRIPTION]])):new Map();
                newState.transactionCode = (value&&!newState.transactionCodes.size)?'N/A':'';
                newState.transactionCodeDescription = '';
                newState.paytransId = (value&&!newState.transactionCodes.size)?paytrans.data.filter(p=>p.FORM_CODE==newState.formCode&&p.ACTION_CODE==newState.actionCode)?.at(0)?.PAYTRANS_ID:'';
                break;
            case "formActions.transactionCode":
                newState.transactionCode = value;
                newState.transactionCodeDescription = (value)?newState.transactionCodes.get(value)?.at(1):'';
                newState.paytransId = (value)?paytrans.data.filter(p=>p.FORM_CODE==newState.formCode&&p.ACTION_CODE==newState.actionCode&&p.TRANSACTION_CODE==newState.transactionCode)?.at(0)?.PAYTRANS_ID:''
                break;
        }
        return newState;
    },null,initCodes);

    useEffect(()=>paytrans.data&&setCodes(['init']),[paytrans.data,payroll,roleType]);

    useEffect(()=>{
        if (!paytrans.data) return;
        if (codes.paytransId == getValues('formActions.paytransId')) return;

        const c = {...codes};
        c.formCodes = Array.from(codes.formCodes.entries());
        c.actionCodes = Array.from(codes.actionCodes.entries());
        c.transactionCodes = Array.from(codes.transactionCodes.entries());
        setValue('formActions',c);

        const tabs = paytrans.data.filter(p=>p.PAYTRANS_ID==codes.paytransId)?.at(0)?.TABS;
        console.debug('Tabs: ',tabs);
        handleTabs(tabs);
    },[codes]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Form Actions</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Form Code:</Form.Label>
                <Col xs="auto">
                    {paytrans.isError && <Loading isError>Error Loading Payroll Transactions</Loading>}
                    {paytrans.isLoading && <Loading>Loading Payroll Transactions...</Loading>}
                    {paytrans.data &&
                        <Controller
                            name="formActions.formCode"
                            control={control}
                            render={({field}) => (
                                <Form.Control {...field} as="select" onChange={e=>{field.onChange(e);setCodes([e,field]);}} aria-describedby="formCodeDescription">
                                    <option></option>
                                    {Array.from(codes.formCodes.entries()).map(c=><option key={c[0]} value={c[0]}>{c[1][0]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                </Col>
                {codes.formCodeDescription && <Col xs="auto">
                    <Form.Text id="formCodeDescription" className="mt-2" muted>{codes.formCodeDescription}</Form.Text>
                </Col>}
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Action Code:</Form.Label>
                <Col xs="auto">
                    {paytrans.data &&
                        <Controller
                            name="formActions.actionCode"
                            control={control}
                            render={({field}) => (codes.actionCode=='N/A')?
                            (
                                <Form.Control {...field} plaintext readOnly value="N/A"/>
                            ):
                            (
                                <Form.Control {...field} as="select" onChange={e=>{field.onChange(e);setCodes([e,field]);}} aria-describedby="actionCodeDescription">
                                    <option></option>
                                    {Array.from(codes.actionCodes.entries()).map(c=><option key={c[0]} value={c[0]}>{c[1][0]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                </Col>
                {codes.actionCodeDescription && <Col xs="auto">
                    <Form.Text id="actionCodeDescription" className="mt-2" muted>{codes.actionCodeDescription}</Form.Text>
                </Col>}
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Transaction Code:</Form.Label>
                <Col xs="auto">
                    {paytrans.data &&
                        <Controller
                            name="formActions.transactionCode"
                            control={control}
                            render={({field}) => (codes.transactionCode=='N/A')?
                            (
                                <Form.Control plaintext readOnly value="N/A"/>
                            ):
                            (
                                <Form.Control {...field} as="select" onChange={e=>{field.onChange(e);setCodes([e,field]);}} aria-describedby="transactionCodeDescription">
                                    <option></option>
                                    {Array.from(codes.transactionCodes.entries()).map(c=><option key={c[0]} value={c[0]}>{c[1][0]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                </Col>
                {codes.transactionCodeDescription && <Col xs="auto">
                    <Form.Text id="actionCodeDescription" className="mt-2" muted>{codes.transactionCodeDescription}</Form.Text>
                </Col>}
            </Form.Group>
        </article>
    );
}
