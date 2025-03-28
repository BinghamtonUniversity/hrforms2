import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col, Form, InputGroup, Table, Alert } from "react-bootstrap";
import { useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form";
import { HRFormContext, conditionalFields, useHRFormContext } from "../../config/form";
import DatePicker from "react-datepicker";
import SUNYAccount, { SingleSUNYAccount } from "../sunyaccount";
import { AppButton, CurrencyFormat, DateFormat, DepartmentSelector } from "../components";
import { Icon } from "@iconify/react";
import { cloneDeep, get } from "lodash";
import useFormQueries from "../../queries/forms";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import useListsQueries from "../../queries/lists";

const name = 'employment.salary';

export default function EmploymentAppointment() {
    const [editing,setEditing] = useState(undefined);

    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit, activeNav, showInTest, testHighlight, formType } = useHRFormContext();

    const watchAmounts = useWatch({name:[
        `${name}.RATE_AMOUNT`,
        `${name}.NUMBER_OF_PAYMENTS`,
        'employment.position.APPOINTMENT_PERCENT'
    ],control:control,defaultValue:[0,1,100]});
    const watchPayBasis = useWatch({name:'employment.position.positionDetails.PAY_BASIS',control:control});
    const watchEffectiveDate = useWatch({name:'employment.position.apptEffDate',control:control,defaultValue:new Date(0)});
    const watchTransactionCode = useWatch({name:'formActions.transactionCode.TRANSACTION_CODE',control:control,defaultValue:''});
    const rateAmountLabel = useMemo(() => {
        switch(watchPayBasis) {
            case "BIW":
            case "FEE":
                return "Biweekly";
            case "HRY":
                return "Hourly";
            default:
                return "Full-Time";
        }
    },[watchPayBasis]);

    const handleNumPmtsField = (e,field) => {
        switch (e.type) {
            case 'change':
                if (parseInt(e.target.value,10) < 1) return false;
                field.onChange(e);
                break;
            case 'blur':
                if (!e.target.value) setValue(field.name,1);
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        if (['BIW', 'FEE', 'HRY'].includes(watchPayBasis)) {
            setValue(`${name}.totalSalary`,(+watchAmounts[0]*+watchAmounts[1]).toFixed(2));
        } else {
            setValue(`${name}.totalSalary`,((+watchAmounts[0]*+watchAmounts[1]) * (+watchAmounts[2]/100)).toFixed(2));
        }
    },[watchAmounts,watchPayBasis]);

    useEffect(() => {
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);

    return (
        <article>
            <section className="mt-3">
                <Row as="header">
                    <Col as="h3">Salary</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Effective Date*:</Form.Label>
                    <Col xs="auto">
                        <InputGroup>
                            <Controller
                                name={`${name}.effDate`}
                                control={control}
                                render={({field}) => <Form.Control
                                    as={DatePicker}
                                    name={field.name}
                                    selected={getValues('effDate')}
                                    closeOnScroll={true}
                                    onChange={field.onChange}
                                    autoComplete="off"
                                    disabled={!canEdit}
                                    isInvalid={!!get(errors,field.name,false)}
                                />}
                            />
                            <InputGroup.Append>
                                <InputGroup.Text>
                                    <Icon icon="mdi:calendar-blank"/>
                                </InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                        {get(errors,`${name}.effDate.message`,false)&&
                            <Form.Control.Feedback type="invalid" style={{display:'block'}}>{get(errors,`${name}.effDate.message`,'')}</Form.Control.Feedback>
                        }
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Pay Basis:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <p className="mb-0">{watchPayBasis}</p>
                    </Col>
                </Form.Group>
                {(!['HRY','BIW','FEE'].includes(watchPayBasis)||showInTest) && 
                    <Form.Group as={Row} className={testHighlight(!['HRY','BIW','FEE'].includes(watchPayBasis))}>
                        <Form.Label column md={2}>Appointment Percent:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <p className="mb-0">{watchAmounts[2]}%</p>
                        </Col>
                    </Form.Group>
                }
                {(!['EXS','SUM','WIN'].includes(watchTransactionCode)||showInTest) &&
                    <>
                        {(['BIW','FEE'].includes(watchPayBasis)||showInTest) && 
                            <Form.Group as={Row} className={testHighlight(['BIW','FEE'].includes(watchPayBasis))}>
                                <Form.Label column md={2}># Payments*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.NUMBER_OF_PAYMENTS`}
                                        defaultValue={defaultValues[`${name}.NUMBER_OF_PAYMENTS`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={1} onBlur={e=>handleNumPmtsField(e,field)} onChange={e=>handleNumPmtsField(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.NUMBER_OF_PAYMENTS.message`,'')}</Form.Control.Feedback>
                                </Col>
                            </Form.Group>
                        }
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>{rateAmountLabel} Rate*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.RATE_AMOUNT`}
                                    defaultValue={defaultValues[`${name}.RATE_AMOUNT`]}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}.RATE_AMOUNT.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Total Salary:</Form.Label>
                            <Col xs="auto" className="pt-2">
                            <Controller
                                    name={`${name}.totalSalary`}
                                    defaultValue={defaultValues[`${name}.totalSalary`]}
                                    control={control}
                                    render={({field}) => <p className="mb-0"><CurrencyFormat>{field.value}</CurrencyFormat></p>}
                                />
                            </Col>
                        </Form.Group>
                        <SUNYAccount label="SUNY Account*:" name={`${name}.SUNY_ACCOUNTS`} isInvalid={!!get(errors,`${name}.SUNY_ACCOUNTS`,false)} disabled={!canEdit||['a','s'].includes(editing)}/>
                    </>
                }
            </section>
            
            <AdditionalSalary editing={editing} setEditing={setEditing}/>

            {/** Only show Split Assignment for Add/Update Split Assignments */}
            {(conditionalFields.splitAssignment.includes(formType)||showInTest) && <SplitAssignments className={testHighlight(conditionalFields.splitAssignment.includes(formType))} editing={editing} setEditing={setEditing}/>}

        </article>
    );
}

function AdditionalSalary({editing,setEditing}) {
    const blockName = `${name}.ADDITIONAL_SALARY`;

    const { control, getValues, setValue, setError, clearErrors, formState: { errors } } = useFormContext();
    const { setLockTabs } = useHRFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName
    });

    const watchFieldArray = useWatch({name:blockName,control:control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useListsQueries();
    const types = getListData('additionalSalaryTypes');

    const defaultValues = {            
        type:{id:"",label:""},
        startDate:getValues('effDate'),
        endDate:"",
        account:[{id:"",label:""}],
        payments:1,
        amount:0,
        total: 0,
        created:new Date()
    };

    const handleNew = () => {
        append(defaultValues);
        setEditIndex(fields.length);
        setIsNew(true);
        setLockTabs(true);
        setEditing('a');
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setIsNew(false); // can only edit existing
        setLockTabs(true);
        setEditing('a');
    }
    const handleCancel = index => {
        //const checkFields = Object.keys(fields[index]).map(f=>`${blockName}.${index}.${f}`);
        clearErrors(`${blockName}.${index}`);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setLockTabs(false);
        setEditing(undefined);
    }
    const handleSave = index => {
        clearErrors(`${blockName}.${index}`);
        const arrayData = getValues(`${blockName}.${index}`);
        setValue(`${blockName}.${index}.total`,calcTotal(index)); // here?
        console.debug('Additional Salary Data:',arrayData);

        /* Required fields */
        if (!arrayData.type.id) setError(`${blockName}.${index}.type.id`,{type:'manual',message:'Type is required'});
        if (!arrayData.startDate) setError(`${blockName}.${index}.startDate`,{type:'manual',message:'Start Date is required'});
        if (!arrayData.endDate) setError(`${blockName}.${index}.endDate`,{type:'manual',message:'End Date is required'});
        if (!get(arrayData,'account.0.label','')) setError(`${blockName}.${index}.account`,{type:'manual',message:'Account is required'});
        if (!arrayData.payments) setError(`${blockName}.${index}.payments`,{type:'manual',message:'Pmts is required'});
        if (parseInt(arrayData.payments,10)<1) setError(`${blockName}.${index}.payments`,{type:'manual',message:'Pmts must be greater than zero'});
        if (parseInt(arrayData.amount,10)<1) setError(`${blockName}.${index}.amount`,{type:'manual',message:'Amount must be greater than zero'});
        
        if (Object.keys(get(errors,`${blockName}.${index}`,{})).length > 0) {
            console.error(errors);
            return false;
        } else {
            setEditIndex(undefined);
            setEditValues(undefined);
            setIsNew(false);
            setLockTabs(false);
            setEditing(undefined);
        }
    }

    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setLockTabs(false);
        setEditing(undefined);
    }

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const handlePmtsField = (e,field) => {
        switch (e.type) {
            case 'change':
                if (parseInt(e.target.value,10) < 1) return false;
                field.onChange(e);
                break;
            case 'blur':
                if (!e.target.value) setValue(field.name,1);
                break;
        }
    }

    const handleAmount = (e,field) => {
        switch (e.type) {
            case 'change':
                if (parseInt(e.target.value,10) < 0) return false;
                field.onChange(e);
                break;
            case 'blur':
                if (!e.target.value) setValue(field.name,0);
                break;
        }        
    }

    const calcTotal = useCallback(index=>{
        if (!watchFieldArray) return 0;
        const payments = get(watchFieldArray,`${index}.payments`,1);
        const amount = get(watchFieldArray,`${index}.amount`,0);
        return parseFloat(payments)*parseFloat(amount);
    },[watchFieldArray]);

    useEffect(() => {
        if (editIndex == undefined) return;
        document.querySelector(`[name="${blockName}.${editIndex}.type.id"]`).focus();
    },[editIndex]);

    return (
        <HRFormContext.Consumer>
            {({canEdit}) => (
                <section className="mt-4 border-top pt-2">
                    <Row as="header">
                        <Col as="h3">Additional Salary</Col>
                    </Row>
                    {getValues(`${name}.EXISTING_ADDITIONAL_SALARY`).length>0&&<ExistingAdditionalSalary/>}
                    {fields.map((flds,index)=>(
                        <section key={flds.id} className="border rounded p-2 mb-2">
                            <Form.Row>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Type*:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.type.id`}
                                        defaultValue={defaultValues.type}
                                        control={control}
                                        render={({field}) => (
                                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}>
                                                <option></option>
                                                {types.data && types.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                                            </Form.Control>
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.type.id.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Start Date*:</Form.Label>
                                    <InputGroup>
                                        <Controller
                                            name={`${blockName}.${index}.startDate`}
                                            defaultValue={defaultValues.startDate}
                                            control={control}
                                            render={({field}) => <Form.Control 
                                                as={DatePicker} 
                                                name={field.name}
                                                selected={field.value} 
                                                closeOnScroll={true} 
                                                onChange={field.onChange}
                                                autoComplete="off"
                                                disabled={editIndex!=index}
                                                maxDate={()=>new Date()}
                                                isInvalid={!!get(errors,field.name,false)}
                                            />}
                                        />
                                        <InputGroup.Append>
                                            <InputGroup.Text>
                                                <Icon icon="mdi:calendar-blank"/>
                                            </InputGroup.Text>
                                        </InputGroup.Append>
                                    </InputGroup>
                                    {get(errors,`${blockName}.${index}.startDate.message`,false)&&
                                        <Form.Control.Feedback type="invalid" style={{display:'block'}}>{get(errors,`${blockName}.${index}.startDate.message`,'')}</Form.Control.Feedback>
                                    }
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>End Date*:</Form.Label>
                                    <InputGroup>
                                        <Controller
                                            name={`${blockName}.${index}.endDate`}
                                            defaultValue={defaultValues.endDate}
                                            control={control}
                                            render={({field}) => <Form.Control 
                                                as={DatePicker} 
                                                name={field.name}
                                                selected={field.value} 
                                                closeOnScroll={true} 
                                                onChange={field.onChange}
                                                autoComplete="off"
                                                disabled={editIndex!=index}
                                                isInvalid={!!get(errors,field.name,false)}
                                            />}
                                        />
                                        <InputGroup.Append>
                                            <InputGroup.Text>
                                                <Icon icon="mdi:calendar-blank"/>
                                            </InputGroup.Text>
                                        </InputGroup.Append>
                                    </InputGroup>
                                    {get(errors,`${blockName}.${index}.endDate.message`,false)&&
                                        <Form.Control.Feedback type="invalid" style={{display:'block'}}>{get(errors,`${blockName}.${index}.endDate.message`,'')}</Form.Control.Feedback>
                                    }
                                </Col>
                                <Col xs={6} md={4} className="mb-2">
                                    <Form.Label>Account:</Form.Label>
                                    <SingleSUNYAccount name={`${blockName}.${index}.account`} isInvalid={!!get(errors,`${blockName}.${index}.account`,false)} disabled={editIndex!=index}/>
                                </Col>
                                <Col xs={2} md={1} className="mb-2">
                                    <Form.Label>Pmts*:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.payments`}
                                        defaultValue={defaultValues.payments}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={1} onChange={e=>handlePmtsField(e,field)} onBlur={e=>handlePmtsField(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.payments.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs={4} sm={3} md={2} className="mb-2">
                                    <Form.Label>Amount*:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.amount`}
                                        defaultValue={defaultValues.amount}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" onBlur={e=>handleAmount(e,field)} onChange={e=>handleAmount(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.amount.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs={4} sm={3} md={2} className="mb-2">
                                    <Form.Label>Total:</Form.Label>
                                    <p className="mb-0 py-2"><CurrencyFormat>{calcTotal(index)}</CurrencyFormat></p>
                                </Col>
                            </Form.Row>
                            {canEdit&&
                                <Row>
                                    <Col className="button-group-sm">
                                        {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='s'}>Edit</AppButton>}
                                        {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='s'}>Save</AppButton>}
                                        {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={(editIndex!=undefined&&editIndex!=index)||editing=='s'}>Cancel</AppButton>}
                                        <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='s'}>Remove</AppButton>
                                    </Col>
                                </Row>
                            }
                            <Row>
                                <Col>
                                    <small><span className="fw-bold">Created: </span><DateFormat>{flds.created}</DateFormat></small>
                                </Col>
                                <Col className="text-right">
                                    <small>{index}:{flds.id}</small>
                                </Col>
                            </Row>
                        </section>
                    ))}
                    {canEdit &&
                        <Row>
                            <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined||editing=='s'}>Add Salary</AppButton></Col>
                        </Row>
                    }
                </section>
            )}
        </HRFormContext.Consumer>
    );
}

function ExistingAdditionalSalary() {
    const blockName = `${name}.EXISTING_ADDITIONAL_SALARY`;

    const { getValues } = useFormContext();

    return(
        <Row>
            <Col>
                <Table striped bordered size="sm" responsive>
                    <thead>
                        <tr className="bg-main text-white">
                            <th scope="col">Type</th>
                            <th scope="col">Start Date</th>
                            <th scope="col">End Date</th>
                            <th scope="col">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getValues(`${blockName}`).map(row => (
                            <tr key={row.HR_ADDITIONAL_SALARY_ID}>
                                <td>{row.ADDL_SALARY_EARNING_CODE?.label}</td>
                                <td><DateFormat>{row.ADDL_SALARY_EFFECTIVE_DATE}</DateFormat></td>
                                <td><DateFormat>{row.ADDL_SALARY_END_DATE}</DateFormat></td>
                                <td><CurrencyFormat>{row.ADDL_SALARY_AMOUNT}</CurrencyFormat></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Col>
        </Row>
    );
}

function SplitAssignments({className,editing,setEditing}) {
    const blockName = `${name}.SPLIT_ASSIGNMENTS`;

    const { control, getValues, setValue, setError, clearErrors, formState: { errors } } = useFormContext();
    const { setLockTabs } = useHRFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName,
    });

    const watchFieldArray = useWatch({name:blockName,control:control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();
    const [searchFilter,setSearchFilter] = useState('');
    const [changePrimary,setChangePrimary] = useState(false);
    const [totalPct,setTotalPct] = useState(0);

    const {getListData} = useListsQueries();
    const workAllocation = getListData('workAllocation');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const defaultValues = {
        "HR_COMMITMENT_ID": "",
        "COMMITMENT_PRIMARY_FLAG": "N",
        "COMMITMENT_STACK_ID": "",
        "CAMPUS_TITLE": "",
        "REPORTING_DEPARTMENT_CODE": {"id": "","label": ""},
        "SUPERVISOR_SUNY_ID": "",
        "SUPERVISOR_NAME": "",
        "WORK_ALLOCATION": {"id":"","label":""},
        "WORK_PERCENT": "0",
        "DUTIES": "",
        "supervisor": [{id: "","label":""}],
        "commitmentEffDate":getValues('effDate'),
        "commitmentEndDate":"",
        "createDate":new Date()
    }
    const handleNew = () => {
        append(defaultValues);
        setEditIndex(fields.length);
        setIsNew(true);
        setLockTabs(true);
        setEditing('s');
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setIsNew(false); // can only edit existing
        setLockTabs(true);
        setEditing('s');
    }
    const handleCancel = index => {
        clearErrors(`${blockName}.${index}`);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setChangePrimary(false);
        setLockTabs(false);
        setEditing(undefined);
    }
    const handleSave = index => {
        clearErrors(`${blockName}.${index}`);
        const arrayData = getValues(`${blockName}.${index}`);
        console.debug('Split Assignment Data:',arrayData);

        /* Required Fields */
        if (!arrayData.commitmentEffDate) setError(`${blockName}.${index}.commitmentEffDate`,{type:'manual',message:'Start Date is required'});
        if (!arrayData.WORK_ALLOCATION.id) setError(`${blockName}.${index}.WORK_ALLOCATION.id`,{type:'manual',message:'Allocation is required'});

        if (Object.keys(get(errors,`${blockName}.${index}`,{})).length > 0) {
            console.error(errors);
            return false;
        } else {
            if (changePrimary) {
                watchFieldArray.forEach((a,i) => {
                    if (index!=i&&a.COMMITMENT_PRIMARY_FLAG=='Y') {
                        console.warn(`Changing Primary Flag for index ${i} to "No"`);
                        setValue(`${blockName}.${i}.COMMITMENT_PRIMARY_FLAG`,'N');
                    }
                });
            }
            setEditIndex(undefined);
            setEditValues(undefined);
            setIsNew(false);
            setChangePrimary(false);
            setLockTabs(false);
            setEditing(undefined);
        }
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setChangePrimary(false);
        setLockTabs(false);
        setEditing(undefined);
    }

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const handleSearch = query => setSearchFilter(query);
    const handleBlur = (field,e) => {
        field.onBlur(e);
        const baseName = field.name.split('.').slice(0,-1).join('.');
        if (e.target.value != getValues(`${baseName}.0.label`)) {
            setValue(`${baseName}.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    const handlePrimaryChange = (e,field) => {
        if (e.target.checked) {
            // check for other primary; if any then warn. Set others to N on save
            const filter = watchFieldArray.filter((p,i)=>editIndex!=i&&p.COMMITMENT_PRIMARY_FLAG=='Y');
            field.onChange('Y');
            setChangePrimary(filter?.length>0);
        } else {
            field.onChange('N');
            setChangePrimary(false);
        }
    }

    const handleWorkPct = (e,field) => {
        switch(e.type) {
            case 'change':
                if (e.target.value != "" && (parseInt(e.target.value,10)<0 || parseInt(e.target.value,10)>100)) return false;
                field.onChange(e);
                break;
            case 'blur':
                if (!e.target.value) setValue(field.name,0);
        }
    }

    useEffect(() => searchFilter&&supervisors.refetch(),[searchFilter]);
    /*useEffect(() => {
        if (editIndex == undefined) return;
        //TODO: focus field?
        //document.querySelector(`[name="${blockName}.${editIndex}.type.id"]`).focus();
    },[editIndex]);*/
    useEffect(()=>{
        if (watchFieldArray.length==0) return;
        const pct = watchFieldArray.map(s=>s.WORK_PERCENT).reduce((a,b)=>parseFloat(a)+parseFloat(b));
        setTotalPct(pct);
    },[watchFieldArray]);

    return (
        <HRFormContext.Consumer>
            {({canEdit}) => (
                <section className={`mt-4 border-top pt-2 ${className}`}>
                    <header>
                        <Row>
                            <Col as="h3">Split Assignments</Col>
                        </Row>
                        <Row>
                            <Col>
                                <Alert variant={(editIndex!=undefined)?"info":(totalPct==100)?"success":"danger"}>
                                    <p className="m-0">Total Work Percent: {(editIndex!=undefined)?"updating...":totalPct+"%"} {editIndex==undefined&&totalPct!=100&&<strong className="font-size-85">(Must be 100%)</strong>}</p>
                                </Alert>
                            </Col>
                        </Row>
                    </header>
                    {fields.map((fld,index)=>(
                        <section key={fld.id} className="border rounded p-2 mb-2">
                            {(editIndex==index&&Object.keys(errors).length!=0) && 
                                <Row>
                                    <Col>
                                        <Alert variant="danger"><p className="m-0">Split Assignment has errors - Cannot Save!</p></Alert>
                                    </Col>
                                </Row>
                            }
                            {(editIndex==index&&changePrimary) &&
                                <Row>
                                    <Col>
                                        <Alert variant="warning"><p className="m-0">Warning: You are changing the primary flag to this assignment.  Saving will uncheck all other assigments.</p></Alert>
                                    </Col>
                                </Row>
                            }
                            <Form.Row>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Primary:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.COMMITMENT_PRIMARY_FLAG`}
                                        control={control}
                                        defaultValue={defaultValues.COMMITMENT_PRIMARY_FLAG}
                                        render={({field}) => <Form.Check {...field} type="checkbox" className="ml-3 mt-1 form-check-input-lg" value="Y" onChange={e=>handlePrimaryChange(e,field)} checked={field.value=="Y"} disabled={editIndex!=index}/>}
                                    />
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Start Date*:</Form.Label>
                                    <InputGroup>
                                        <Controller
                                            name={`${blockName}.${index}.commitmentEffDate`}
                                            defaultValue={defaultValues.commitmentEffDate}
                                            control={control}
                                            render={({field}) => <Form.Control 
                                                as={DatePicker} 
                                                name={field.name}
                                                selected={field.value} 
                                                closeOnScroll={true} 
                                                onChange={field.onChange}
                                                autoComplete="off"
                                                disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}
                                                isInvalid={!!get(errors,field.name,false)}
                                                maxDate={()=>new Date()}
                                            />}
                                        />
                                        <InputGroup.Append>
                                            <InputGroup.Text>
                                                <Icon icon="mdi:calendar-blank"/>
                                            </InputGroup.Text>
                                        </InputGroup.Append>
                                    </InputGroup>
                                    <Form.Control.Feedback type="invalid" style={{display:get(errors,`${blockName}.${index}.commitmentEffDate`,false)?'block':'none'}}>{get(errors,`${blockName}.${index}.commitmentEffDate.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>End Date:</Form.Label>
                                    <InputGroup>
                                        <Controller
                                            name={`${blockName}.${index}.commitmentEndDate`}
                                            defaultValue={defaultValues.commitmentEndDate}
                                            control={control}
                                            render={({field}) => <Form.Control 
                                                as={DatePicker} 
                                                name={field.name}
                                                selected={field.value} 
                                                closeOnScroll={true} 
                                                onChange={field.onChange}
                                                autoComplete="off"
                                                disabled={editIndex!=index}
                                            />}
                                        />
                                        <InputGroup.Append>
                                            <InputGroup.Text>
                                                <Icon icon="mdi:calendar-blank"/>
                                            </InputGroup.Text>
                                        </InputGroup.Append>
                                    </InputGroup>
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Title:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.CAMPUS_TITLE`}
                                        defaultValue={defaultValues.CAMPUS_TITLE}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""} isInvalid={!!get(errors,field.name,false)}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.CAMPUS_TITLE.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Department:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.REPORTING_DEPARTMENT_CODE.id`}
                                        defaultValue={defaultValues.REPORTING_DEPARTMENT_CODE}
                                        control={control}
                                        render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""} isInvalid={!!get(errors,field.name,false)}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.REPORTING_DEPARTMENT_CODE.id.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs={12} sm={8} md={6} lg={5} xl={4} className="mb-2">
                                    <Form.Label>Supervisor:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.supervisor`}
                                        defaultValue={defaultValues.supervisor}
                                        control={control}
                                        render={({field}) => <AsyncTypeahead
                                            {...field}
                                            filterBy={()=>true}
                                            id="supervisor-search"
                                            isLoading={supervisors.isLoading}
                                            minLength={2}
                                            flip={true} 
                                            allowNew={true}
                                            onSearch={handleSearch}
                                            onBlur={e=>handleBlur(field,e)}
                                            options={supervisors.data}
                                            placeholder="Search for supervisor..."
                                            selected={field.value}
                                            disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""}
                                        />}
                                    />
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Allocation*:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.WORK_ALLOCATION.id`}
                                        defaultValue={defaultValues.WORK_ALLOCATION}
                                        control={control}
                                        render={({field}) => (
                                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index||fld.HR_COMMITMENT_ID!=""} isInvalid={!!get(errors,field.name,false)}>
                                                <option></option>
                                                {workAllocation.data && workAllocation.data.map(a=><option key={a[0]} value={a[0]}>{a[1]}</option>)}
                                            </Form.Control>
                                        )}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.WORK_ALLOCATION.id.message`,'')}</Form.Control.Feedback>
                                </Col>
                                <Col xs="auto" className="mb-2">
                                    <Form.Label>Work %*:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.WORK_PERCENT`}
                                        defaultValue={defaultValues.WORK_PERCENT}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} max={100} onChange={e=>handleWorkPct(e,field)} onBlur={e=>handleWorkPct(e,field)} disabled={editIndex!=index} isInvalid={(editIndex==undefined&&totalPct!=100)||!!get(errors,field.name,false)}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.WORK_PERCENT.message`,'')}</Form.Control.Feedback>
                                </Col>
                            </Form.Row>
                            <Form.Row>
                                <Col xs={12} sm={10} md={8} lg={6} className="mb-2">
                                    <Form.Label>Duties:</Form.Label>
                                    <Controller
                                        name={`${blockName}.${index}.DUTIES`}
                                        defaultValue={defaultValues.DUTIES}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} as="textarea" rows={2} disabled={editIndex!=index}/>}
                                    />
                                </Col>
                            </Form.Row>
                            {canEdit&&
                                <Row>
                                    <Col className="button-group-sm">
                                        {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='a'}>Edit</AppButton>}
                                        {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='a'}>Save</AppButton>}
                                        {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={(editIndex!=undefined&&editIndex!=index)||editing=='a'}>Cancel</AppButton>}
                                        <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={(editIndex!=undefined&&editIndex!=index)||editing=='a'}>Remove</AppButton>
                                    </Col>
                                </Row>
                            }
                            <Row>
                                <Col>
                                    <small><span className="fw-bold">Created: </span><DateFormat>{fld.createDate}</DateFormat></small>
                                </Col>
                                <Col className="text-right">
                                    <small>{index}:{fld.id}:{fld.HR_COMMITMENT_ID}</small>
                                </Col>
                            </Row>
                        </section>
                    ))}
                    {canEdit&&
                        <Row>
                            <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined||editing=='a'}>Add Assignment</AppButton></Col>
                        </Row>
                    }
                </section>
            )}
        </HRFormContext.Consumer>            
    );
}
