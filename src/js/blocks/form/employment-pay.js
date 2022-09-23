import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { AppButton, DateFormat, DepartmentSelector } from "../components";
import { SingleSUNYAccount } from "../sunyaccount";
import useFormQueries from "../../queries/forms";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { addDays, subDays } from "date-fns";

const name = 'employment.pay';

export default function EmploymentPay() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:name
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
            department:"",
            supervisor:[],
            duties:"",
            created:new Date
        },{
            focusName:`${name}.${fields.length}.startDate`
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setMinDate(addDays(getValues(`${name}.${index}.startDate`),1));
        setMaxDate(subDays(getValues(`${name}.${index}.endDate`),1));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setMinDate(undefined);
        setMaxDate(undefined);
    }
    const handleSave = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
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

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Pay <AppButton format="add" size="sm" onClick={handleNew} disabled={editIndex!=undefined}>New</AppButton></Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Row>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>Start Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${name}.${index}.startDate`}
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
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].startDate`,false)?'block':'none'}}>{get(errors,`${name}[${index}].startDate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs="auto" className="mb-2">
                            <Form.Label>End Date:</Form.Label>
                            <InputGroup>
                                <Controller
                                    name={`${name}.${index}.endDate`}
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
                            <SingleSUNYAccount name={`${name}.${index}.account`} disabled={editIndex!=index}/>
                        </Col>
                        <Col xs={2} md={1} className="mb-2">
                            <Form.Label>Hourly Rate:</Form.Label>
                            <Controller
                                name={`${name}.${index}.hourlyRate`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs={2} md={1} className="mb-2">
                            <Form.Label>Award Amount:</Form.Label>
                            <Controller
                                name={`${name}.${index}.awardAmount`}
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
                                name={`${name}.${index}.department`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <DepartmentSelector field={field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>

                    <PaySupervisor index={index} editIndex={editIndex}/>

                    <Form.Group as={Row}>
                        <Form.Label column xs={4} sm={3} md={2} xl={1}>Duties:</Form.Label>
                        <Col xs={8} md={7} xl={6}>
                            <Controller
                                name={`${name}.${index}.duties`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <Form.Control field={field} disabled={editIndex!=index}/>}
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
        </article>
    );
}

function PaySupervisor({index,editIndex}) {
    const { control, getValues, setValue } = useFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleSearch = query => {
        setSearchFilter(query);
    }
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${name}.${index}.supervisor[0].label`)) {
            setValue(`${name}.${index}.supervisor.0`,{id:`new-id-${index}`,label:e.target.value});
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
                    name={`${name}.${index}.supervisor`}
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
                        placeholder="Search for supervisor..."
                        disabled={editIndex!=index}
                    />}
                />
            </Col>
        </Form.Group>
    );
}
