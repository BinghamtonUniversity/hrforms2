import React, { useState, useCallback } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import { useAppQueries } from "../../queries";
import { AppButton, DateFormat, StateSelector } from "../components";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import PhoneInput from 'react-phone-input-2';

import 'react-phone-input-2/lib/style.css'

//TODO: make address form a component and pass stuff?
//TODO: consolidate the save/edit/cancel/remove footer?

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
    const name = 'person.directory.address';
    const { control, getValues, trigger, clearErrors, formState: { errors } } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:name
    });
    const watchAddress = useWatch({name:name,control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

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
        append({
            type:"",
            department:"",
            building:"",
            room:"",
            line1:"",
            line2:"",
            city:"",
            state:"",
            zipcode:"",
            created:new Date
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
    }
    const handleSave = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);    
            }
        }).catch(e=>console.error(e));
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
    }

    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Addresses <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <section key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type*:</Form.Label>
                        <Col xs="auto">
                            {addressCodes.data && 
                                <Controller
                                    name={`${name}.${index}.type`}
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
                            <Form.Label column md={2}>Line 1*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.line1`}
                                    defaultValue=""
                                    rules={{required:{value:true,message:'Address Line 1 is Required'}}}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}/>}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].line1.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'line2') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Line 2:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.line2`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'department') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Department*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.department`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Department is Required'}}}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}>
                                            <option></option>
                                            {depts.data&&depts.data.map(d=><option key={d.DEPARTMENT_CODE} value={d.DEPARTMENT_CODE}>{d.DEPARTMENT_DESC}</option>)}
                                        </Form.Control>
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].department.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'building') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Building*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.building`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Building is Required'}}}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}>
                                            <option></option>
                                            {buildings.data&&buildings.data.map(b=><option key={b[0]} value={b[0]}>{b[0]} - {b[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].building.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'room') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>Room:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.room`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)}/>}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {testField(index,'city') &&
                        <Form.Group as={Row} className="mb-1">
                            <Form.Label column md={2}>City/State/Zip*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.city`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'City is Required'}}}
                                    render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}/>}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].city.message`,'')}</Form.Control.Feedback>
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.state`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'State is Required'}}}
                                    render={({field}) => <StateSelector field={field} disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}/>}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].state.message`,'')}</Form.Control.Feedback>
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.zipcode`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Zip Code is Required'}}}
                                    render={({field}) => <Form.Control {...field} disabled={editIndex!=index||!editableType(index)} isInvalid={get(errors,field.name,false)}/>}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].zipcode.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&editableType(index)&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{field.created}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            {fields.length>0 && 
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Address</AppButton></Col>
                </Row>
            }
        </article>
    );
}

function PersonDirectoryPhone() {
    const name = 'person.directory.phone'
    const { control, getValues, setValue, trigger, clearErrors, formState: { errors } } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:name
    });
    const watchPhone = useWatch({name:name,control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useAppQueries();
    const phoneTypes = getListData('phoneTypes');

    const editableType = useCallback(index => {
        if (!phoneTypes.data) return true;
        return phoneTypes.data.find(c=>c.id==watchPhone?.[index]?.type)?.edit;
    },[phoneTypes.data,watchPhone]);

    const handlePhoneChange = (args,index) => {
        const [value,country,e,formattedValue] = args;
        setValue(`${name}.${index}.number`,value);
        setValue(`${name}.${index}.formattedValue`,formattedValue);
        setValue(`${name}.${index}.country`,country);
        if (country.countryCode == 'us') {
            setValue(`${name}.${index}.parsed`,value.slice(1,).split(/(\d{3})(\d{3})(\d{4})/));
        } else {
            setValue(`${name}.${index}.parsed`,'');
        }
    }
    const handleNew = () => {
        if (fields.length > 2) return;
        append({
            type:"",
            number:"",
            effDate:new Date,
            created:new Date
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
    }
    const handleSave = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
    }
    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Phone Numbers <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <section key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type:</Form.Label>
                        <Col xs="auto">
                            {phoneTypes.data && 
                                <Controller
                                    name={`${name}.${index}.type`}
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
                            <Form.Label column md={2}>Phone*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.number`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Phone is Required'}}}
                                    render={({field}) => <PhoneInput 
                                        {...field} 
                                        country={'us'} 
                                        preferredCountries={['us']} 
                                        enableLongNumbers={true}
                                        inputClass="form-control" 
                                        onChange={(...args)=>handlePhoneChange(args,index)} 
                                        disabled={editIndex!=index||!editableType(index)}
                                        isInvalid={get(errors,field.name,false)}
                                    />}
                                />
                                <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].number`,false)?'block':'none'}}>{get(errors,`${name}[${index}].number.message`,'')}</Form.Control.Feedback>
                            </Col>
                            <Form.Label column md={2}>Effective Date*:</Form.Label>
                            <Col xs="auto">
                                <InputGroup>
                                    <Controller
                                        name={`${name}.${index}.effDate`}
                                        defaultValue=""
                                        control={control}
                                        rules={{required:{value:true,message:'Effective Date is Required'}}}
                                        render={({field}) => <Form.Control
                                            as={DatePicker}
                                            name={field.name}
                                            closeOnScroll={true}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            disabled={editIndex!=index||!editableType(index)}
                                            isInvalid={get(errors,field.name,false)}
                                            autoComplete="off"
                                        />}
                                    />
                                    <InputGroup.Append>
                                        <InputGroup.Text>
                                            <Icon icon="mdi:calendar-blank"/>
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                                <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].effDate`,false)?'block':'none'}}>{get(errors,`${name}[${index}].effDate.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&editableType(index)&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{field.created}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            {fields.length>0 && 
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Phone</AppButton></Col>
                </Row>
            }
        </article>
    );
}

function PersonDirectoryEmail() {
    const name = 'person.directory.email';
    const { control, getValues, trigger, clearErrors, formState: { errors } } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:name
    });
    const watchEmail = useWatch({name:name,control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useAppQueries();
    const emailTypes = getListData('emailTypes');
    
    const editableType = useCallback(index => {
        if (!emailTypes.data) return true;
        return emailTypes.data.find(c=>c.id==watchEmail?.[index]?.type)?.edit;
    },[emailTypes.data,watchEmail]);

    const handleNew = () => {
        if (fields.length > 2) return;
        append({
            type:"",
            email:"",
            effDate:new Date,
            created:new Date
        });
        setEditIndex(fields.length);
        setIsNew(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setIsNew(false); // can only edit existing
    }
    const handleCancel = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        clearErrors(checkFields);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
    }
    const handleSave = index => {
        const checkFields = Object.keys(fields[index]).map(f=>`${name}.${index}.${f}`);
        trigger(checkFields).then(valid => {
            if (!valid) {
                console.log('Errors!',errors);
            } else {
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));
    }
    const handleRemove = index => {
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
    }
    return (
        <article className="py-3">
            <Row as="header">
                <Col as="h4">Email Addresses <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton></Col>
            </Row>
            {fields.map((field,index)=>(
                <section key={field.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>Type:</Form.Label>
                        <Col xs="auto">
                            {emailTypes.data && 
                                <Controller
                                    name={`${name}.${index}.type`}
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
                            <Form.Label column md={2}>Email*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.email`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Email is Required'}}}
                                    render={({field}) => <Form.Control
                                        {...field} 
                                        type="email"
                                        disabled={editIndex!=index||!editableType(index)}
                                        isInvalid={get(errors,field.name,false)}
                                    />}
                                />
                                <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].email.message`,'')}</Form.Control.Feedback>
                            </Col>
                            <Form.Label column md={2}>Effective Date*:</Form.Label>
                            <Col xs="auto">
                                <InputGroup>
                                    <Controller
                                        name={`${name}.${index}.effDate`}
                                        defaultValue=""
                                        control={control}
                                        rules={{required:{value:true,message:'Effective Date is Required'}}}
                                        render={({field}) => <Form.Control
                                            as={DatePicker}
                                            name={field.name}
                                            closeOnScroll={true}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            disabled={editIndex!=index||!editableType(index)}
                                            isInvalid={get(errors,field.name,false)}
                                            autoComplete="off"
                                        />}
                                    />
                                    <InputGroup.Append>
                                        <InputGroup.Text>
                                            <Icon icon="mdi:calendar-blank"/>
                                        </InputGroup.Text>
                                    </InputGroup.Append>
                                </InputGroup>
                                <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].effDate`,false)?'block':'none'}}>{get(errors,`${name}[${index}].effDate.message`,'')}</Form.Control.Feedback>
                            </Col>
                        </Form.Group>
                    }
                    <Row>
                        <Col className="button-group-sm">
                            {(editIndex!=index&&editableType(index)) && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                            {(editIndex==index&&editableType(index)) && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                            {(editIndex==index&&editableType(index)&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{field.created}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{field.id}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            {fields.length>0 && 
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Email</AppButton></Col>
                </Row>
            }
        </article>
    );
}