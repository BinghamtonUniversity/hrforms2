import React, { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { AppButton, CurrencyFormat, DateFormat, DepartmentSelector, PersonPickerComponent } from "../components";
import { SingleSUNYAccount } from "../sunyaccount";
import { addDays, subDays } from "date-fns";
import DataTable from "react-data-table-component";
import { useHRFormContext } from "../../config/form";

const name = 'employment.pay';

export default function EmploymentPay() {
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Pay</Col>
            </Row>
            <ExistingEmploymentPayTable/>
            <NewEmploymentPay/>
        </article>
    );
}

function ExistingEmploymentPayTable() {
    const blockName = `${name}.existingPay`;
    const { getValues, setError, clearErrors, control, formState: { defaultValues, errors } } = useFormContext();
    const data = getValues(blockName);

    const CalendarPortal = ({children}) => {
        return createPortal(<div>{children}</div>,document.body);
    };

    const handleEndDateBlur = (e,field) => {
        if (e.target.value == "") {
            setError(field.name,{type:'custom',message:'Existing Pay End Date is required'});
            console.log(field.name);
            console.log(errors);
        } else {
            clearErrors(field.name);
        }
    }

    const ExpandedComponent = ({data}) => <pre className="m-3"><span className="font-weight-bold">Duties:</span> {data.DUTIES}</pre>
    const columns = useMemo(() => [
        {name:'Start Date',selector:row=><DateFormat>{row.commitmentEffDate}</DateFormat>},
        {name:'End Date',selector:(row,index)=>(
            <Controller
                name={`${blockName}.${index}.commitmentEndDate`}
                control={control}
                defaultValue={defaultValues[`${blockName}.${index}.commitmentEndDate`]}
                render={({field}) => <Form.Control 
                    as={DatePicker} 
                    name={field.name}
                    selected={field.value} 
                    closeOnScroll={true} 
                    onChange={field.onChange}
                    onBlur={e=>handleEndDateBlur(e,field)}
                    autoComplete="off"
                    popperContainer={CalendarPortal}
                    isInvalid={!!get(errors,field.name,false)}
                />}
            />
        )},
        {name:'Account',selector:row=>[row.ACCOUNT_NUMBER?.ACCOUNT_CODE,row.ACCOUNT_NUMBER?.ACCOUNT_DESCRIPTION].join(': ')},
        {name:'Department',selector:row=>row.REPORTING_DEPARTMENT_NAME},
        {name:'Supervisor',selector:row=>row.supervisorSortName},
        {name:'Hourly Rate',selector:row=><CurrencyFormat>{row.COMMITMENT_RATE}</CurrencyFormat>},
        {name:'Award Amount',selector:row=><CurrencyFormat>{row.STUDENT_AWARD_AMOUNT}</CurrencyFormat>,hide:!getValues('payroll.ADDITIONAL_INFO.showStudentAwardAmount')}
    ],[data,errors]);
    return (
        <section>
            <Row as="header">
                <Col as="h4">Existing Pay</Col>
            </Row>
            <Row>
                <Col>
                    <DataTable 
                        keyField="HR_COMMITMENT_ID"
                        columns={columns} 
                        data={data}
                        striped 
                        responsive
                        pointerOnHover
                        highlightOnHover        
                        expandableRows 
                        expandOnRowClicked
                        expandableRowsComponent={ExpandedComponent}
                    />
                </Col>
            </Row>
        </section>
    );
}

function NewEmploymentPay() {
    const blockName = `${name}.newPay`;
    const { canEdit, setLockTabs } = useHRFormContext();

    const { control, getValues, setValue, clearErrors, setError, formState: { errors } } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName
    });

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();
    const [minDate,setMinDate] = useState();
    const [maxDate,setMaxDate] = useState();

    const defaultValues = {
        startDate:getValues('effDate')||new Date(),
        endDate:"",
        account:[{id:"",label:""}],
        hourlyRate:"",
        awardAmount:"",
        department:{id:"",label:""},
        supervisor:[{id:"",label:""}],
        duties:"",
        created:new Date()
    };

    const handleNew = () => {
        if (fields.length > 2) return;
        append(defaultValues,{
            focusName:`${blockName}.${fields.length}.startDate`
        });
        setEditIndex(fields.length);
        setIsNew(true);
        setLockTabs(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setMinDate(addDays(getValues(`${blockName}.${index}.startDate`),1));
        setMaxDate(subDays(getValues(`${blockName}.${index}.endDate`),1));
        setIsNew(false); // can only edit existing
        setLockTabs(true);
    }
    const handleCancel = index => {
        clearErrors(`${blockName}.${index}`);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setMinDate(undefined);
        setMaxDate(undefined);
        setLockTabs(false);
    }
    const handleSave = index => {
        clearErrors(`${blockName}.${index}`);
        const arrayData = getValues(`${blockName}.${index}`);
        console.debug('New Pay Data:',arrayData);

        /* Required fields */
        if (!arrayData.startDate) setError(`${blockName}.${index}.startDate`,{type:'manual',message:'Start Date is required'});
        if (!arrayData.endDate) setError(`${blockName}.${index}.endDate`,{type:'manual',message:'End Date is required'});
        if (!get(arrayData,'account.0.label','')) setError(`${blockName}.${index}.account`,{type:'manual',message:'Account is required'});
        if (parseInt(arrayData.hourlyRate,10)<=0) setError(`${blockName}.${index}.hourlyRate`,{type:'manual',message:'Hourly Rate must be greater than zero'});
        if (!arrayData.hourlyRate) setError(`${blockName}.${index}.hourlyRate`,{type:'manual',message:'Hourly Rate is required'});
        if (!get(arrayData,'department.id','')) setError(`${blockName}.${index}.department.id`,{type:'manual',message:'Department is required'});
        if (!get(arrayData,'supervisor.0.label','')) setError(`${blockName}.${index}.supervisor`,{type:'manual',message:'Supervisor is required'});
        if (!arrayData.duties) setError(`${blockName}.${index}.duties`,{type:'manual',message:'Duties are required'});
        
        if (Object.keys(get(errors,`${blockName}.${index}`,{})).length > 0) {
            console.error(errors);
            return false;
        } else {
            setMinDate(undefined);
            setMaxDate(undefined);
            setEditIndex(undefined);
            setEditValues(undefined);
            setIsNew(false);
            setLockTabs(false);
        }
    }
    const handleRemove = index => {
        remove(index);
        setMinDate(undefined);
        setMaxDate(undefined);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setLockTabs(false);
    }

    const handleDateChange = useCallback((d,field) => {
        field.onChange(d);
        if (field?.name.split('.').pop() == 'startDate') setMinDate(addDays(d,1));
        if (field?.name.split('.').pop() == 'endDate') setMaxDate(subDays(d,1));
    },[setMinDate,setMaxDate,getValues]);

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">New Pay</Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Row>
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
                                        closeOnScroll={true}
                                        selected={field.value}
                                        onChange={d=>handleDateChange(d,field,index)}
                                        disabled={editIndex!=index}
                                        isInvalid={!!get(errors,field.name,false)}
                                        autoComplete="off"
                                        maxDate={maxDate}
                                        autoFocus
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${blockName}.${index}.startDate`,false)?'block':'none'}}>{get(errors,`${blockName}.${index}.startDate.message`,'')}</Form.Control.Feedback>
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
                                        closeOnScroll={true}
                                        selected={field.value}
                                        onChange={d=>handleDateChange(d,field,index)}
                                        disabled={editIndex!=index}
                                        isInvalid={!!get(errors,field.name,false)}
                                        autoComplete="off"
                                        minDate={minDate}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${blockName}.${index}.endDate`,false)?'block':'none'}}>{get(errors,`${blockName}.${index}.endDate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs={6} md={4} className="mb-2">
                            <Form.Label>Account*:</Form.Label>
                            <SingleSUNYAccount name={`${blockName}.${index}.account`} isInvalid={!!get(errors,`${blockName}.${index}.account.message`,false)} disabled={editIndex!=index} required/>
                        </Col>
                        <Col xs={6} sm={3} md={2} className="mb-2">
                            <Form.Label>Hourly Rate*:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.hourlyRate`}
                                defaultValue={defaultValues.hourlyRate}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" min={0} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.hourlyRate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs={6} sm={3} md={2} className="mb-2">
                            <Form.Label>Award Amount:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.awardAmount`}
                                defaultValue={defaultValues.awardAmount}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" min={0} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Row>
                    <Form.Group as={Row}>
                        <Form.Label column xs={4} sm={3} md={2} xl={1}>Department*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${blockName}.${index}.department.id`}
                                control={control}
                                defaultValue={defaultValues.department}
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.department.id.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>

                    <PaySupervisor index={index} editIndex={editIndex}/>

                    <Form.Group as={Row}>
                        <Form.Label column xs={4} sm={3} md={2} xl={1}>Duties*:</Form.Label>
                        <Col xs={8} md={7} xl={6}>
                            <Controller
                                name={`${blockName}.${index}.duties`}
                                control={control}
                                defaultValue={defaultValues.duties}
                                render={({field}) => <Form.Control {...field} isInvalid={!!get(errors,field.name,false)} disabled={editIndex!=index}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.duties.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Row>
                        <Col className="button-group-sm">
                            {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
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
                <Row as="footer">
                    <Col>
                        <AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined}>Add New Pay</AppButton>
                    </Col>
                </Row>
            }
        </section>
    );
}

function PaySupervisor({index,editIndex}) {
    const blockName = `${name}.newPay`;
    const { control, getValues, setValue, formState: { errors } } = useFormContext();
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${blockName}.${index}.supervisor[0].label`)) {
            setValue(`${blockName}.${index}.supervisor.0`,{id:`new-id-${index}`,label:e.target.value});
        }
    }
    return (
        <Form.Group as={Row}>
            <Form.Label column xs={4} sm={3} md={2} xl={1}>Supervisor*:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${blockName}.${index}.supervisor`}
                    defaultValue={[{id:'',label:''}]}
                    control={control}
                    render={({field}) => <PersonPickerComponent
                        field={field}
                        id={`supervisor-search-${index}`}
                        placeholder="Search for Supervisor"
                        onBlur={e=>handleBlur(field,e)}
                        disabled={editIndex!=index}
                        isInvalid={!!get(errors,field.name,false)}
                        />
                    }
                />
                <Form.Control.Feedback type="invalid">{get(errors,`${blockName}.${index}.supervisor.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}
