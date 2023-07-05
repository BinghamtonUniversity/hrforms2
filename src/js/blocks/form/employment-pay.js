import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { AppButton, CurrencyFormat, DateFormat, DepartmentSelector } from "../components";
import { SingleSUNYAccount } from "../sunyaccount";
import useFormQueries from "../../queries/forms";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
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
    const { getValues, control } = useFormContext();
    const data = getValues(blockName);

    const CalendarPortal = ({children}) => {
        return createPortal(<div>{children}</div>,document.body);
    };

    const ExpandedComponent = ({data}) => <pre className="m-3"><span className="font-weight-bold">Duties:</span> {data.DUTIES}</pre>
    const columns = useMemo(() => [
        {name:'Start Date',selector:row=><DateFormat>{row.commitmentEffDate}</DateFormat>},
        {name:'End Date',selector:(row,index)=>(
            <Controller
                name={`${blockName}.${index}.commitmentEndDate`}
                control={control}
                render={({field}) => <Form.Control 
                    as={DatePicker} 
                    name={field.name}
                    selected={field.value} 
                    closeOnScroll={true} 
                    onChange={field.onChange}
                    autoComplete="off"
                    popperContainer={CalendarPortal}
                />}
            />
        )},
        {name:'Account',selector:row=>[row.ACCOUNT_NUMBER?.ACCOUNT_CODE,row.ACCOUNT_NUMBER?.ACCOUNT_DESCRIPTION].join(': ')},
        {name:'Department',selector:row=>row.REPORTING_DEPARTMENT_NAME},
        {name:'Supervisor',selector:row=>row.supervisorSortName},
        {name:'Hourly Rate',selector:row=><CurrencyFormat>{row.COMMITMENT_RATE}</CurrencyFormat>},
        {name:'Award Amount',selector:row=><CurrencyFormat>{row.STUDENT_AWARD_AMOUNT}</CurrencyFormat>,hide:!getValues('payroll.ADDITIONAL_INFO.showStudentAwardAmount')}
    ],[data]);
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
    const { canEdit } = useHRFormContext();

    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:blockName
    });

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();
    const [minDate,setMinDate] = useState();
    const [maxDate,setMaxDate] = useState();

    const handleNew = () => {
        if (fields.length > 2) return;
        append({
            startDate:"",
            endDate:"",
            account:[],
            hourlyRate:"",
            awardAmount:"",
            department:{id:"",label:""},
            supervisor:[],
            duties:"",
            created:new Date
        },{
            focusName:`${blockName}.${fields.length}.startDate`
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${blockName}.${index}`)));
        setMinDate(addDays(getValues(`${blockName}.${index}.startDate`),1));
        setMaxDate(subDays(getValues(`${blockName}.${index}.endDate`),1));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${blockName}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setMinDate(undefined);
        setMaxDate(undefined);
    }
    const handleSave = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${blockName}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                setMinDate(undefined);
                setMaxDate(undefined);
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));
    }
    const handleRemove = index => {
        remove(index);
        setMinDate(undefined);
        setMaxDate(undefined);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
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
                            <Form.Label>Start Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.startDate`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Start Date is Required'}}}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        closeOnScroll={true}
                                        selected={field.value}
                                        onChange={d=>handleDateChange(d,field,index)}
                                        disabled={editIndex!=index}
                                        isInvalid={get(errors,field.name,false)}
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
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].startDate`,false)?'block':'none'}}>{get(errors,`${name}.${index}.startDate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>End Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${blockName}.${index}.endDate`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'End Date is Required'}}}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        closeOnScroll={true}
                                        selected={field.value}
                                        onChange={d=>handleDateChange(d,field,index)}
                                        disabled={editIndex!=index}
                                        isInvalid={get(errors,field.name,false)}
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
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].endDate`,false)?'block':'none'}}>{get(errors,`${name}[${index}].endDate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs={6} md={4} className="mb-2">
                            <Form.Label>Account:</Form.Label>
                            <SingleSUNYAccount name={`${blockName}.${index}.account`} disabled={editIndex!=index}/>
                        </Col>
                        <Col xs={6} sm={3} md={2} className="mb-2">
                            <Form.Label>Hourly Rate:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.hourlyRate`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs={6} sm={3} md={2} className="mb-2">
                            <Form.Label>Award Amount:</Form.Label>
                            <Controller
                                name={`${blockName}.${index}.awardAmount`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Row>
                    <Form.Group as={Row}>
                        <Form.Label column xs={4} sm={3} md={2} xl={1}>Department:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${blockName}.${index}.department.id`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>

                    <PaySupervisor index={index} editIndex={editIndex}/>

                    <Form.Group as={Row}>
                        <Form.Label column xs={4} sm={3} md={2} xl={1}>Duties:</Form.Label>
                        <Col xs={8} md={7} xl={6}>
                            <Controller
                                name={`${blockName}.${index}.duties`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
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
    const { control, getValues, setValue } = useFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleSearch = query => {
        setSearchFilter(query);
    }
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${blockName}.${index}.supervisor[0].label`)) {
            setValue(`${blockName}.${index}.supervisor.0`,{id:`new-id-${index}`,label:e.target.value});
        }
    }

    useEffect(() => {
        if (!searchFilter) return;
        supervisors.refetch();
    },[searchFilter]);
    return (
        <Form.Group as={Row}>
            <Form.Label column xs={4} sm={3} md={2} xl={1}>Supervisor:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${blockName}.${index}.supervisor`}
                    defaultValue=""
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
                        selected={field.value}
                        placeholder="Search for supervisor..."
                        disabled={editIndex!=index}
                    />}
                />
            </Col>
        </Form.Group>
    );
}
