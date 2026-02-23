import React, { useState, useCallback, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { get, cloneDeep } from "lodash";
import { AppButton, CountrySelector, DateFormat, StateSelector } from "../components";
import PhoneInput from 'react-phone-input-2';
import useListsQueries from "../../queries/lists";
import { useHRFormContext } from "../../config/form";

import 'react-phone-input-2/lib/style.css'
import { FormFieldErrorMessage } from "../../pages/form";

const name = 'person.contact.contacts';
const idName = 'personContact';

const phoneTypes = [
    {id:'EMR_CTC_DAY_PHONE',title:'Day Phone'},
    {id:'EMR_CTC_NIGHT_PHONE',title:'Home Phone'},
    {id:'EMR_CTC_CELL_PHONE',title:'Cell Phone'},
];

export default function PersonContacts() {
    const { control, getValues, setValue, clearErrors, setError, formState: { errors } } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:name
    });

    const watchContact = useWatch({name:name,control});

    const { canEdit, activeNav, setLockTabs } = useHRFormContext();

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useListsQueries();
    const relationships = getListData('contactRelationships');

    const defaultValues = {
        "EMR_CTC_RANK": "",
        "EMR_CTC_FIRST_NAME": "",
        "EMR_CTC_LAST_NAME": "",
        "EMR_CTC_ADDRESS_1": "",
        "EMR_CTC_ADDRESS_2": "",
        "EMR_CTC_CITY": "",
        "EMR_CTC_STATE_CODE": "",
        "EMR_CTC_ZIP": "",
        "EMR_CTC_COUNTRY_CODE": {id: "", label: ""},
        "EMR_CTC_DAY_PHONE": "",
        "EMR_CTC_NIGHT_PHONE": "",
        "EMR_CTC_CELL_PHONE": "",
        "EMR_CTC_INTERNATIONAL_PHONE": "",
        "EMR_CTC_EMAIL": "",
        "EMR_CTC_RELATIONSHIP": {"id": "","label": ""},
        "CREATE_DATE": "",
        "isPrimary": "N",
        "createDate":new Date()
    };

    const handleNew = useCallback(() => {
        if (fields.length > 2) return;
        append(defaultValues);
        setEditIndex(fields.length);
        setIsNew(true);
        setLockTabs(true);
    },[append,fields.length,setLockTabs]);
    const handleEdit = useCallback(index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setIsNew(false); // can only edit existing
        setLockTabs(true);
    },[getValues,setLockTabs]);
    const handleCancel = useCallback(index => {
        clearErrors(`${name}.${index}`);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setLockTabs(false);
    },[update,editValues,setLockTabs]);
    const handleSave = useCallback(index => {
        clearErrors(`${name}.${index}`);
        const arrayData = getValues(`${name}.${index}`);
        console.debug(arrayData);

        /* Required fields */
        if (!arrayData?.EMR_CTC_FIRST_NAME) setError(`${name}.${index}.EMR_CTC_FIRST_NAME`,{type:'manual',message:'First Name is required'});
        if (!arrayData?.EMR_CTC_LAST_NAME) setError(`${name}.${index}.EMR_CTC_LAST_NAME`,{type:'manual',message:'Last Name is required'});
        if (!arrayData?.EMR_CTC_RELATIONSHIP?.id) setError(`${name}.${index}.EMR_CTC_RELATIONSHIP.id`,{type:'manual',message:'Relationship is required'});
        if (!arrayData?.EMR_CTC_DAY_PHONE&&!arrayData?.EMR_CTC_CELL_PHONE&&!arrayData?.EMR_CTC_NIGHT_PHONE&&!arrayData?.EMR_CTC_INTERNATIONAL_PHONE) setError(`${name}.${index}.EMR_CTC_PHONE`,{type:'manual',message:'A phone number is required'});

        if (Object.keys(get(errors,`${name}.${index}`,{})).length > 0) {
            console.error(errors);
            return false;
        } else {
            if (watchContact.length > 1) {
                const m = watchContact.map(c=>c['isPrimary']).filter(v=>v=='Y');
                if (m.length > 1) {
                    m.forEach((v,i) => {
                        if (i != index) {
                            const id = fields[i].id;
                            console.warn(`Changing Primary for Contact index ${i} (id:${id}) to "no"`);
                            setValue(`${name}.${i}.isPrimary`,'N');
                        }
                    });
                }
            }
            setEditIndex(undefined);
            setEditValues(undefined);
            setIsNew(false);
            setLockTabs(false);
        }
    },[getValues,setError,errors,watchContact,fields,setValue,setLockTabs]);
    const handleRemove = useCallback(index => {
        clearErrors(`${name}.${index}`);
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setLockTabs(false);
    },[remove,setLockTabs]);

    const handleSelectChange = useCallback((e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    },[setValue]);

    const checkPrimary = useCallback(() => {
        if (watchContact.length < 2) return false;
        if (watchContact.map(c=>c['isPrimary']).filter(v=>v=='Y').length>1) return true;
        return false;
    },[watchContact]);

    const handleEscape = useCallback((e,index) => {
        if (e.key == 'Escape' && editIndex != undefined) handleCancel(index);
        if (e.key == 'Escape' && isNew) handleRemove(index);
    },[editIndex,isNew,handleCancel,handleRemove]);

    useEffect(()=>{
        const field = document.querySelector(`#${activeNav} input:not([disabled]):not([readonly])`);
        ((isNew||editIndex!=undefined)&&field) && field.focus({focusVisible:true});
    },[editIndex,isNew,activeNav]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Contacts {canEdit && <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton>}</Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2" onKeyDown={e=>handleEscape(e,index)}>
                    <Row as="fieldset" className="mb-1">
                        <Col md={2}>
                            <legend className="form-label col-form-label">Primary:</legend>
                        </Col>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.${index}.isPrimary`}
                                defaultValue={defaultValues.isPrimary}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} id={`${idName}${index}-isPrimary-yes`} inline type="radio" label="Yes" value="Y" checked={field.value=="Y"} disabled={editIndex!=index}/>
                                        <Form.Check {...field} id={`${idName}${index}-isPrimary-no`} inline type="radio" label="No" value="N" checked={field.value!="Y"} disabled={editIndex!=index}/>
                                    </>
                                )}
                            />
                            {(editIndex==index&&checkPrimary()) &&
                                <div>
                                    <small className="text-warning">Warning: At least one other contact is set as Primary.  If you save all others will be changed to no.</small>
                                </div>
                            }
                        </Col>
                    </Row>
                    <Row as="fieldset" className="mb-1">
                        <Col md={2}>
                            <legend className="form-label col-form-label">Name*:</legend>
                        </Col>
                        <Col xs={6} md={4}>
                            <Form.Label htmlFor={`${idName}${index}-firstName`} className="font-italic mb-0 text-muted font-size-90">First Name</Form.Label>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_FIRST_NAME`}
                                defaultValue={defaultValues.EMR_CTC_FIRST_NAME}
                                control={control}
                                render={({field}) => <Form.Control {...field} id={`${idName}${index}-firstName`} disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}/>}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.${index}.EMR_CTC_FIRST_NAME`}/>
                        </Col>
                        <Col xs={6} md={4}>
                            <Form.Label htmlFor={`${idName}${index}-lastName`} className="font-italic mb-0 text-muted font-size-90">Last Name</Form.Label>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_LAST_NAME`}
                                defaultValue={defaultValues.EMR_CTC_LAST_NAME}
                                control={control}
                                render={({field}) => <Form.Control {...field} id={`${idName}${index}-lastName`} disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}/>}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.${index}.EMR_CTC_LAST_NAME`}/>
                        </Col>
                    </Row>
                    <Form.Group as={Row} className="mb-1" controlId={`${idName}${index}-addressLine1`}>
                        <Form.Label column md={2}>Address Line 1:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_ADDRESS_1`}
                                defaultValue={defaultValues.EMR_CTC_ADDRESS_1}
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1" controlId={`${idName}${index}-addressLine2`}>
                        <Form.Label column md={2}>Address Line 2:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_ADDRESS_2`}
                                defaultValue={defaultValues.EMR_CTC_ADDRESS_2}
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Row as="fieldset" className="mb-1">
                        <Col md={2}>
                            <legend className="form-label col-form-label">City/State/Zip:</legend>
                        </Col>
                        <Col xs="auto">
                            <Form.Label htmlFor={`${idName}${index}-city`} srOnly>City:</Form.Label>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_CITY`}
                                defaultValue={defaultValues.EMR_CTC_CITY}
                                control={control}
                                render={({field}) => <Form.Control {...field} id={`${idName}${index}-city`} disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Form.Label htmlFor={`${idName}${index}-state`} srOnly>State:</Form.Label>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_STATE_CODE`}
                                defaultValue={defaultValues.EMR_CTC_STATE_CODE}
                                control={control}
                                render={({field}) => <StateSelector field={field} id={`${idName}${index}-state`} disabled={editIndex!=index}/>}
                            />
                        </Col>
                        <Col xs="auto">
                            <Form.Label htmlFor={`${idName}${index}-zip`} srOnly>Zip:</Form.Label>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_ZIP`}
                                defaultValue={defaultValues.EMR_CTC_ZIP}
                                control={control}
                                render={({field}) => <Form.Control {...field} id={`${idName}${index}-zip`} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Row>
                    <Form.Group as={Row} className="mb-1" controlId={`${idName}${index}-countryCode`}>
                        <Form.Label column md={2}>Country:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.EMR_CTC_COUNTRY_CODE.id`}
                                defaultValue={defaultValues.EMR_CTC_COUNTRY_CODE}
                                control={control}
                                render={({field}) => <CountrySelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    {phoneTypes.map(p => (
                        <Form.Group key={p.id} as={Row} className="mb-0">
                            <Form.Label column md={2} htmlFor={`${idName}${index}-${p.id}`}>{p.title}:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.${index}.${p.id}`}
                                    defaultValue={defaultValues[p.id]}
                                    control={control}
                                    render={({field}) => <PhoneInput 
                                        {...field} 
                                        inputProps={{id:`${idName}${index}-${p.id}`}}
                                        country={'us'} 
                                        onlyCountries={['us','ca']} 
                                        enableLongNumbers={true}
                                        disableDropdown={true}
                                        disableCountryCode={true}
                                        inputClass="form-control" 
                                        disabled={editIndex!=index}
                                        isValid={()=>!get(errors,`${name}.${index}.EMR_CTC_PHONE`,false)}
                                    />}
                                />
                            </Col>
                        </Form.Group>
                    ))}
                    <Form.Group as={Row} className="mb-0">
                        <Form.Label column md={2} htmlFor={`${idName}${index}-EMR_CTC_INTERNATIONAL_PHONE`}>International Phone:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.EMR_CTC_INTERNATIONAL_PHONE`}
                                defaultValue={defaultValues.EMR_CTC_INTERNATIONAL_PHONE}
                                control={control}
                                render={({field}) => <PhoneInput 
                                    {...field} 
                                    inputProps={{id:`${idName}${index}-EMR_CTC_INTERNATIONAL_PHONE`}}
                                    excludeCountries={['us','ca']} 
                                    enableLongNumbers={true}
                                    inputClass="form-control" 
                                    disabled={editIndex!=index}
                                    isValid={()=>!get(errors,`${name}.${index}.EMR_CTC_PHONE`,false)}
                                />}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.${index}.EMR_CTC_PHONE`}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1" controlId={`${idName}${index}-email`}>
                        <Form.Label column md={2}>Email Address:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.EMR_CTC_EMAIL`}
                                defaultValue={defaultValues.EMR_CTC_EMAIL}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="email" disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1" controlId={`${idName}${index}-relationship`}>
                        <Form.Label column md={2}>Relationship*:</Form.Label>
                        <Col xs="auto">
                            {relationships.isLoading && <p>Loading...</p>}
                            {relationships.isError && <p>Error Loading</p>}
                            {relationships.data &&
                                <Controller
                                    name={`${name}.${index}.EMR_CTC_RELATIONSHIP.id`}
                                    defaultValue={defaultValues.EMR_CTC_RELATIONSHIP}
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}>
                                            <option></option>
                                            {relationships.data.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                            <FormFieldErrorMessage fieldName={`${name}.${index}.EMR_CTC_RELATIONSHIP.id`}/>
                        </Col>
                    </Form.Group>
                    {canEdit && 
                        <Row>
                            <Col className="button-group-sm">
                                {editIndex!=index && <AppButton format="edit" className="mr-1" size="sm" onClick={()=>handleEdit(index)} disabled={editIndex!=undefined&&editIndex!=index}>Edit</AppButton>}
                                {editIndex==index && <AppButton format="save" className="mr-1" size="sm" onClick={()=>handleSave(index)} disabled={editIndex!=undefined&&editIndex!=index}>Save</AppButton>}
                                {(editIndex==index&&!isNew) && <AppButton format="cancel" className="mr-1" size="sm" onClick={()=>handleCancel(index)} variant="secondary" disabled={editIndex!=undefined&&editIndex!=index}>Cancel</AppButton>}
                                <AppButton format="delete" className="mr-1" size="sm" onClick={()=>handleRemove(index)} disabled={editIndex!=undefined&&editIndex!=index}>Remove</AppButton>
                            </Col>
                        </Row>
                    }
                    <Row>
                        <Col>
                            <small><span className="fw-bold">Created: </span><DateFormat>{flds.createDate}</DateFormat></small>
                        </Col>
                        <Col className="text-right">
                            <small>{index}:{flds.id}</small>
                        </Col>
                    </Row>
                </section>
            ))}
            {fields.length>0&&canEdit &&
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Contact</AppButton></Col>
                </Row>
            }
        </article>
    );
}