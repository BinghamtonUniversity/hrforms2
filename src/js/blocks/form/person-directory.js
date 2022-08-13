import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { AppButton } from "../components";
import DatePicker from "react-datepicker";
import PhoneInput from 'react-phone-input-2';

import 'react-phone-input-2/lib/style.css'

export default function PersonDirectory() {
    return (
        <>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Directory</Col>
                </Row>
                <Row>
                    <Col>
                        <p>Enter directory information below.</p>
                    </Col>
                </Row>
            </article>
            <PersonDirectoryAddresses/>
            <PersonDirectoryPhone/>
            <PersonDirectoryEmail/>
        </>
    );
}

function PersonDirectoryAddresses() {
    const { control } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:'person.directory.address'
    });
    const watchAddress = useWatch({name:'person.directory.address',control});

    const [editIndex,setEditIndex] = useState();

    const {getListData} = useAppQueries();
    const addressCodes = getListData('addressCodes');
    const buildings = getListData('buildings');
    const depts = getListData('deptOrgs');

    const testField = useCallback((index,fld) => {
        if (!addressCodes.data) return false;
        return addressCodes.data.find(c=>c.id==watchAddress?.[index]?.type)?.fields.includes(fld);
    },[watchAddress,addressCodes.data]);
    const editableType = useCallback(index => {
        if (!addressCodes.data) return true;
        return addressCodes.data.find(c=>c.id==watchAddress?.[index]?.type)?.edit;
    },[addressCodes.data,watchAddress]);

    const handleNew = () => {
        if (fields.length > 2) return;
        append({type:"",department:"",building:"",room:"",line1:"",line2:"",city:"",state:"",zipcode:"",created:""});
        setEditIndex(fields.length);
    }
    const handleEdit = index => {
        setEditIndex(index);
    }
    const handleSave = index => {
        setEditIndex(undefined);
        console.log(fields[index]);
    }
    const handleRemove = index => {
        remove(index);
    }

    //TODO: make adress form a component and pass stuff
    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Addresses <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <div key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type:</Form.Label>
                        <Col xs="auto">
                            {addressCodes.data && 
                                <Controller
                                    name={`person.directory.address.${index}.type`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => addressCodes.data.map(c => {
                                        if (!c.show) return null;
                                        return <Form.Check key={c.id} {...field} inline type="radio" label={c.title} value={c.id} checked={field.value==c.id} disabled={editIndex!=index||!c.edit}/>;
                                    })}
                                />
                            }
                            {!watchAddress[index]?.type && <Form.Text muted>You must select an address type in order to edit address information</Form.Text>}
                        </Col>
                    </Form.Group>
                    {testField(index,'line1') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Line 1:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.line1`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'line2') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Line 2:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.line2`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'department') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Department:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.department`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" disabled={editIndex!=index||!editableType(index)}>
                                            <option></option>
                                            {depts.data&&depts.data.map(d=><option key={d.DEPARTMENT_CODE} value={d.DEPARTMENT_CODE}>{d.DEPARTMENT_DESC}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'building') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Building:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.building`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" disabled={editIndex!=index||!editableType(index)}>
                                            <option></option>
                                            {buildings.data&&buildings.data.map(b=><option key={b[0]} value={b[0]}>{b[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'room') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Room:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.room`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'city') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>City:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.address.${index}.city`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)}>Save</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span>mm/dd/yyyy</small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </div>
            ))}
        </article>
    );
}

function PersonDirectoryPhone() {
    const { control, setValue } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:'person.directory.phone'
    });
    const watchPhone = useWatch({name:'person.directory.phone',control});

    const [editIndex,setEditIndex] = useState();

    const {getListData} = useAppQueries();
    const phoneTypes = getListData('phoneTypes');

    const testField = useCallback((index,fld) => {
        if (!phoneTypes.data) return false;
        return phoneTypes.data.find(c=>c.id==watchPhone?.[index]?.type)?.fields.includes(fld);
    },[watchPhone,phoneTypes.data]);
    const editableType = useCallback(index => {
        if (!phoneTypes.data) return true;
        return phoneTypes.data.find(c=>c.id==watchPhone?.[index]?.type)?.edit;
    },[phoneTypes.data,watchPhone]);

    const handlePhoneChange = (args,field,index) => {
        const [value,country,e,formattedValue] = args;
        setValue(`person.directory.phone.${index}.number`,value);
        setValue(`person.directory.phone.${index}.formattedValue`,formattedValue);
        setValue(`person.directory.phone.${index}.country`,country);
        if (country.countryCode == 'us') {
            setValue(`person.directory.phone.${index}.parsed`,value.slice(1,).split(/(\d{3})(\d{3})(\d{4})/));
        } else {
            setValue(`person.directory.phone.${index}.parsed`,'');
        }
    }
    const handleNew = () => {
        if (fields.length > 2) return;
        append({type:"",number:"",effDate:"",created:""});
        setEditIndex(fields.length);
    }
    const handleEdit = index => {
        setEditIndex(index);
    }
    const handleSave = index => {
        setEditIndex(undefined);
        console.log(fields[index]);
    }
    const handleRemove = index => {
        remove(index);
    }
    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Phone Numbers <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <div key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type:</Form.Label>
                        <Col xs="auto">
                            {phoneTypes.data && 
                                <Controller
                                    name={`person.directory.phone.${index}.type`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => phoneTypes.data.map(c => {
                                        if (!c.show) return null;
                                        return <Form.Check key={c.id} {...field} inline type="radio" label={c.title} value={c.id} checked={field.value==c.id} disabled={editIndex!=index||!c.edit}/>;
                                    })}
                                />
                            }
                            {!watchPhone[index]?.type && <Form.Text muted>You must select a phone type in order to edit phone information</Form.Text>}
                        </Col>
                    </Form.Group>
                    {watchPhone[index]?.type &&
                        <Form.Group as={Row} className="mb-0">
                            <Form.Label column md={2}>Phone:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.phone.${index}.number`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <PhoneInput 
                                        {...field} 
                                        country={'us'} 
                                        preferredCountries={['us']} 
                                        enableLongNumbers={true}
                                        inputClass="form-control" 
                                        onChange={(...args)=>handlePhoneChange(args,field,index)} 
                                        disabled={editIndex!=index||!editableType(index)}
                                    />}
                                />
                            </Col>
                            <Form.Label column md={2}>Effective Date:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.phone.${index}.effDate`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        closeOnScroll={true} 
                                        selected={field.value} 
                                        onChange={field.onChange}
                                        disabled={editIndex!=index||!editableType(index)}
                                    />}
                                />
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)}>Save</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span>mm/dd/yyyy</small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </div>
            ))}
        </article>
    );
}

function PersonDirectoryEmail() {
    const { control, setValue } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:'person.directory.email'
    });
    const watchEmail = useWatch({name:'person.directory.email',control});

    const [editIndex,setEditIndex] = useState();

    const {getListData} = useAppQueries();
    const emailTypes = getListData('emailTypes');

    const testField = useCallback((index,fld) => {
        if (!emailTypes.data) return false;
        return emailTypes.data.find(c=>c.id==watchEmail?.[index]?.type)?.fields.includes(fld);
    },[watchEmail,emailTypes.data]);
    const editableType = useCallback(index => {
        if (!emailTypes.data) return true;
        return emailTypes.data.find(c=>c.id==watchEmail?.[index]?.type)?.edit;
    },[emailTypes.data,watchEmail]);

    const handleNew = () => {
        if (fields.length > 2) return;
        append({type:"",email:"",effDate:"",created:""});
        setEditIndex(fields.length);
    }
    const handleEdit = index => {
        setEditIndex(index);
    }
    const handleSave = index => {
        setEditIndex(undefined);
        console.log(fields[index]);
    }
    const handleRemove = index => {
        remove(index);
    }
    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Email Addresses <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <div key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type:</Form.Label>
                        <Col xs="auto">
                            {emailTypes.data && 
                                <Controller
                                    name={`person.directory.email.${index}.type`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => emailTypes.data.map(c => {
                                        if (!c.show) return null;
                                        return <Form.Check key={c.id} {...field} inline type="radio" label={c.title} value={c.id} checked={field.value==c.id} disabled={editIndex!=index||!c.edit}/>;
                                    })}
                                />
                            }
                            {!watchEmail[index]?.type && <Form.Text muted>You must select an email type in order to edit email information</Form.Text>}
                        </Col>
                    </Form.Group>
                    {watchEmail[index]?.type &&
                        <Form.Group as={Row} className="mb-0">
                            <Form.Label column md={2}>Email:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.email.${index}.email`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control
                                        {...field} 
                                        type="email"
                                        disabled={editIndex!=index||!editableType(index)}
                                    />}
                                />
                            </Col>
                            <Form.Label column md={2}>Effective Date:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`person.directory.email.${index}.effDate`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control 
                                        as={DatePicker} 
                                        name={field.name}
                                        closeOnScroll={true} 
                                        selected={field.value} 
                                        onChange={field.onChange}
                                        disabled={editIndex!=index||!editableType(index)}
                                    />}
                                />
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)}>Save</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span>mm/dd/yyyy</small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </div>
            ))}
        </article>
    );
}