import React, { useState, useCallback } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import { AppButton, CountrySelector, DateFormat, StateSelector } from "../components";
import { useAppQueries } from "../../queries";
import PhoneInput from 'react-phone-input-2';

import 'react-phone-input-2/lib/style.css'

const phoneTypes = [
    {id:'day',title:'Day Phone'},
    {id:'night',title:'Night Phone'},
    {id:'cell',title:'Cell Phone'},
];

const name = 'person.contact';

export default function PersonContacts() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    const { fields, append, remove, move, update } = useFieldArray({
        control:control,
        name:name
    });

    const watchContact = useWatch({name:name,control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useAppQueries();
    const countryCodes = getListData('countryCodes');
    const relationships = getListData('contactRelationships');

    const handleNew = () => {
        if (fields.length > 2) return;
        append({
            primary: 'no',
            name: {
                first: "",
                last: ""
            },
            line1: "",
            line2: "",
            city: "",
            state: "",
            zipcode: "",
            country: "",
            phone: {
                day: "",
                night: "",
                cell: "",
                intl: ""
            },
            email: "",
            relationship: "",
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
                if (watchContact.length > 1) {
                    const m = watchContact.map(c=>c['primary']).filter(v=>v=='yes');
                    if (m.length > 1) {
                        m.forEach((v,i) => {
                            if (i != index) {
                                const id = fields[i].id;
                                console.warn(`Changing Primary for Contact index ${i} (id:${id}) to "no"`);
                                setValue(`${name}.${i}.primary`,'no');
                            }
                        });
                    }
                }
                setEditIndex(undefined);
                setEditValues(undefined);
                setIsNew(false);
            }
        }).catch(e=>console.error(e));
    }
    const handleRemove = index => {
        remove(index);
    }

    const checkPrimary = useCallback(() => {
        if (watchContact.length < 2) return false;
        if (watchContact.map(c=>c['primary']).filter(v=>v=='yes').length>1) return true;
        return false;
    },[watchContact]);


    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Contacts <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New</AppButton></Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Primary:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.${index}.primary`}
                                defaultValue={false}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline type="radio" label="Yes" value="yes" checked={field.value=="yes"} disabled={editIndex!=index}/>
                                        <Form.Check {...field} inline type="radio" label="No" value="no" checked={field.value=="no"} disabled={editIndex!=index}/>
                                    </>
                                )}
                            />
                            {(editIndex==index&&checkPrimary()) &&
                                <div>
                                    <small className="text-warning">Warning: At least one other contact is set as Primary.  If you save all others will be changed to no.</small>
                                </div>
                            }
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Name*:</Form.Label>
                        <Col xs={6} md={4}>
                            <Controller
                                name={`${name}.${index}.name.first`}
                                defaultValue=""
                                control={control}
                                rules={{required:{value:true,message:'First Name is Required'}}}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index} isInvalid={get(errors,field.name,false)}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].name.first.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col xs={6} md={4}>
                            <Controller
                                name={`${name}.${index}.name.last`}
                                defaultValue=""
                                control={control}
                                rules={{required:{value:true,message:'Last Name is Required'}}}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index} isInvalid={get(errors,field.name,false)}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].name.last.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Address Line 1:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.line1`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Address Line 2:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.line2`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>City/State/Zip:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.city`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.state`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <StateSelector field={field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.zipcode`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Country:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.country`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <CountrySelector field={field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    {phoneTypes.map(p => (
                        <Form.Group key={p.id} as={Row} className="mb-0">
                            <Form.Label column md={2}>{p.title}:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.phone.${index}.${p.id}`}
                                    defaultValue=""
                                    control={control}
                                    render={({field}) => <PhoneInput 
                                        {...field} 
                                        country={'us'} 
                                        onlyCountries={['us','ca']} 
                                        enableLongNumbers={true}
                                        disableDropdown={true}
                                        disableCountryCode={true}
                                        inputClass="form-control" 
                                        disabled={editIndex!=index}
                                    />}
                                />
                            </Col>
                        </Form.Group>
                    ))}
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2}>International Phone:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.phone.${index}.intl`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <PhoneInput 
                                    {...field} 
                                    excludeCountries={['us','ca']} 
                                    enableLongNumbers={true}
                                    inputClass="form-control" 
                                    disabled={editIndex!=index}
                                />}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Email Address:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.email`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} type="email" disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={2}>Relationship*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.relationship`}
                                defaultValue=""
                                control={control}
                                rules={{required:{value:true,message:'Relationship is Required'}}}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" disabled={editIndex!=index} isInvalid={get(errors,field.name,false)}>
                                        <option></option>
                                        {relationships.data&&relationships.data.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}
                                    </Form.Control>
                                )}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].relationship.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Row>
                        <Col className="button-group-sm">
                            {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)}>Edit</AppButton>}
                            {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)}>Save</AppButton>}
                            {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary">Cancel</AppButton>}
                            <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)}>Remove</AppButton>
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
            {fields.length>0 &&
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2}>New Contact</AppButton></Col>
                </Row>
            }
        </article>
    );
}