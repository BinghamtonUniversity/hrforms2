import React, { useState, useCallback, useEffect, useRef } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import useFormQueries from "../../queries/forms";
import { get, cloneDeep } from "lodash";
import { AppButton, CountrySelector, DateFormat, Loading, StateSelector } from "../components";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import { Typeahead } from "react-bootstrap-typeahead";
import { Icon } from "@iconify/react";
import useListsQueries from "../../queries/lists";
import { useHRFormContext } from "../../config/form";
import { FormFieldErrorMessage } from "../../pages/form";

const name = 'person.education.institutions';

const yesNoOptions = [
    {id:'HIGHEST_DEGREE_FLAG',title:'Highest Degree',unique:true},
    {id:'TERMINAL_DEGREE_FLAG',title:'Terminal Degree',unique:true},
    {id:'DEGREE_VERIFIED',title:'Verified Degree',unique:false}
];

const defaultValues = {
    "DEGREE_YEAR": "",
    "DEGREE_MONTH": "",
    "PENDING_DEGREE_FLAG": "N",
    "DEGREE_TYPE": [{id:"",label:""}],
    "DEGREE_PROGRAM": [{id:"",label:""}],
    "COUNTRY_CODE": {id:"",label:""},
    "INSTITUTION_STATE": "",
    "INSTITUTION_CITY": "",
    "INSTITUTION_ID": "",
    "INSTITUTION": "",
    "HIGHEST_DEGREE_FLAG": "N",
    "TERMINAL_DEGREE_FLAG": "N",
    "DEGREE_VERIFIED": "N",
    "CREATE_DATE": "",
    "awardDate": null,
    "institutionName":[{id:"",label:""}],
    "institutionCity":[],
    "specialization": "",
    "createDate":new Date()
}

export default function PersonEducation() {
    const { control, getValues, setValue, setError, clearErrors, formState: { errors } } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control:control,
        name:name
    });

    const watchEducation = useWatch({name:name,control});

    const { canEdit, activeNav, setLockTabs } = useHRFormContext();

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const { getListData } = useListsQueries();
    const degreeTypes = getListData('degreeTypes',{select:d=>{
        return d.map(degree=>{return {id:degree.DEGREE_TYPE_CODE,label:`${degree.DEGREE_TYPE_CODE} - ${degree.DEGREE_TYPE_DESC}`}});
    }});

    const handleNew = () => {
        if (fields.length > 2) return;
        append(defaultValues);
        setEditIndex(fields.length);
        setIsNew(true);
        setLockTabs(true);
    }
    const handleEdit = index => {
        setEditIndex(index);
        setEditValues(cloneDeep(getValues(`${name}.${index}`)));
        setIsNew(false); // can only edit existing
        setLockTabs(true);
    }
    const handleCancel = index => {
        clearErrors(`${name}.${index}`);
        update(index,editValues);
        setEditValues(undefined);
        setEditIndex(undefined);
        setLockTabs(false);
    }
    const handleSave = index => {
        clearErrors(`${name}.${index}`);
        const arrayData = getValues(`${name}.${index}`);
        console.debug('Education Data:',arrayData);

        /* Required fields */
        if (!arrayData?.awardDate) setError(`${name}.${index}.awardDate`,{type:'manual',message:'Award Date is required'});
        if (!arrayData?.DEGREE_TYPE?.at(0)?.label) setError(`${name}.${index}.DEGREE_TYPE`,{type:'manual',message:'Degree Type is required'});
        if (!arrayData?.DEGREE_PROGRAM?.at(0)?.label) setError(`${name}.${index}.DEGREE_PROGRAM`,{type:'manual',message:'Degree Program/Major is required'});
        if (!arrayData?.COUNTRY_CODE?.id) setError(`${name}.${index}.COUNTRY_CODE.id`,{type:'manual',message:'University/College Country is required'});
        if (arrayData?.COUNTRY_CODE?.id == 'USA') {
            if (!arrayData?.INSTITUTION_STATE) {
                setError(`${name}.${index}.INSTITUTION_STATE`,{type:'manual',message:'University/College State is required'});
            } else {
                if (arrayData?.institutionCity?.length!=1) setError(`${name}.${index}.institutionCity`,{type:'manual',message:'University/College City is required'});
            }
        } 
        if (!arrayData?.institutionName?.at(0)?.label) setError(`${name}.${index}.institutionName`,{type:'manual',message:'University/College Name is required'});

        if (Object.keys(get(errors,`${name}.${index}`,{})).length > 0) {
            console.error(errors);
            return false;
        } else {
            if (watchEducation.length > 1) {
                yesNoOptions.filter(yn=>yn.unique).map(yn=>yn.id).forEach(k=>{
                    const m = watchEducation.map(e=>e[k]).filter(v=>v=='Y');
                    if (m.length > 1) {
                        m.forEach((v,i) => {
                            if (i != index) {
                                const title = yesNoOptions.find(yn=>yn.id==k)?.title;
                                const id = fields[i].id;
                                console.warn(`Changing ${title} for Education index ${i} (id:${id}) to "no"`);
                                setValue(`${name}.${i}.${k}`,'N');
                            }
                        });
                    }
                });
            }
            setValue(`${name}.${index}.DEGREE_YEAR`,watchEducation[index].awardDate.getFullYear());
            setValue(`${name}.${index}.DEGREE_MONTH`,`${watchEducation[index].awardDate.getMonth()+1}`.padStart(2,'0'));
            setValue(`${name}.${index}.INSTITUTION_ID`,watchEducation[index].institutionName[0]?.id);
            setValue(`${name}.${index}.INSTITUTION`,watchEducation[index].institutionName[0]?.label);
            setValue(`${name}.${index}.INSTITUTION_CITY`,watchEducation[index].institutionCity[0]);
            setEditIndex(undefined);
            setEditValues(undefined);
            setIsNew(false);
            setLockTabs(false);
        }
    }
    const handleRemove = index => {
        clearErrors(`${name}.${index}`);
        remove(index);
        setEditIndex(undefined);
        setEditValues(undefined);
        setIsNew(false);
        setLockTabs(false);
    }

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameArray = field.name.split('.');
        let fieldName = nameArray.pop();
        if (fieldName == 'id') fieldName = nameArray.pop();
        const nameBase = nameArray.join('.');
        switch (fieldName) {
            case "COUNTRY_CODE":
                setValue(`${nameBase}.COUNTRY_CODE.label`,e.target.selectedOptions?.item(0)?.label);
                setValue(`${nameBase}.INSTITUTION_STATE`,"");
            case "INSTITUTION_STATE":
                setValue(`${nameBase}.institutionCity`,[]);
                setValue(`${nameBase}.institutionName`,[]);
        }
    }

    const handlePendingChange = field => {
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.awardDate`,(field.value=='Y')?null:addDays(new Date(),1));
        setValue(`${nameBase}.PENDING_DEGREE_FLAG`,(field.value=='Y')?"N":"Y");
    }
    const checkYeNoOptions = useCallback(key => {
        if (!yesNoOptions.find(yn=>yn.id==key)?.unique) return false;
        if (watchEducation.length < 2) return false;
        if (watchEducation.map(e=>e[key]).filter(v=>v=='Y').length>1) return true;
        return false;
    },[watchEducation,yesNoOptions]);

    const getMinMaxDate = useCallback((index,type) => {
        let min = null;
        let max = null;
        if (watchEducation[index]?.PENDING_DEGREE_FLAG == 'Y') {
            min = new Date();
        } else {
            max = new Date();
        }
        if (type == 'min') return min;
        if (type == 'max') return max;
    },[watchEducation]);

    const handleEscape = (e,index) => {
        if (e.key == 'Escape' && editIndex != undefined) handleCancel(index);
        if (e.key == 'Escape' && isNew) handleRemove(index);
    }

    useEffect(()=>{
        editIndex!=undefined && document.querySelector(`#${activeNav} [name="${name}.${editIndex}.awardDate"]`).focus();
    },[editIndex,isNew,activeNav]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Education {canEdit&&<AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton>}</Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2" onKeyDown={e=>handleEscape(e,index)}>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Award Date*:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.${index}.awardDate`}
                                    defaultValue={defaultValues.awardDate}
                                    control={control}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        dateFormat="MMM yyyy"
                                        showMonthYearPicker
                                        minDate={getMinMaxDate(index,'min')}
                                        maxDate={getMinMaxDate(index,'max')}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        disabled={editIndex!=index}
                                        isInvalid={!!get(errors,field.name,false)}
                                        autoComplete="off"
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                            <FormFieldErrorMessage fieldName={`${name}.${index}.awardDate`}/>
                        </Col>
                        <Col className="pt-2">
                            <Controller
                                name={`${name}.${index}.PENDING_DEGREE_FLAG`}
                                defaultValue={defaultValues.PENDING_DEGREE_FLAG}
                                control={control}
                                render={({field}) => <Form.Check {...field} label="Pending Degree" onChange={()=>handlePendingChange(field)} checked={field.value=='Y'} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Type*:</Form.Label>
                        <Col xs={12} md={8}>
                            {degreeTypes.isError && <Loading isError error={degreeTypes.error}>Error Loading Degree Types</Loading>}
                            {degreeTypes.isLoading && <Loading>Loading Degree Types</Loading>}
                            {degreeTypes.data &&
                                <Controller
                                    name={`${name}.${index}.DEGREE_TYPE`}
                                    defaultValue={defaultValues.DEGREE_TYPE}
                                    control={control}
                                    render={({field}) => <Typeahead 
                                        {...field} 
                                        id={`degreeType-${index}`}
                                        options={degreeTypes.data} 
                                        flip={true} 
                                        minLength={2} 
                                        allowNew={true} 
                                        selected={field.value}
                                        disabled={editIndex!=index}
                                        isInvalid={!!get(errors,field.name,false)}
                                    />}
                                />
                            }
                            <FormFieldErrorMessage fieldName={`${name}.${index}.DEGREE_TYPE`}/>
                        </Col>
                    </Form.Group>

                    <DegreeProgramComponent index={index} editIndex={editIndex}/>

                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Specialization:</Form.Label>
                        <Col md={8}>
                            <Controller
                                name={`${name}.${index}.specialization`}
                                defaultValue={defaultValues.specialization}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text" disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}/>}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>University/College Country*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.COUNTRY_CODE.id`}
                                defaultValue={defaultValues.COUNTRY_CODE}
                                control={control}
                                render={({field}) => <CountrySelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}/>}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.${index}.COUNTRY_CODE.id`}/>
                        </Col>
                    </Form.Group>
                    {watchEducation[index]?.COUNTRY_CODE.id=='USA' &&
                        <>
                            <Form.Group as={Row} className="mb-1">
                                <Form.Label column md={3}>University/College State*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${index}.INSTITUTION_STATE`}
                                        defaultValue={defaultValues.INSTITUTION_STATE}
                                        control={control}
                                        render={({field}) => <StateSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={editIndex!=index} isInvalid={!!get(errors,field.name,false)}/>}
                                    />
                                    <FormFieldErrorMessage fieldName={`${name}.${index}.INSTITUTION_STATE`}/>
                                </Col>
                            </Form.Group>
                            {watchEducation[index]?.INSTITUTION_STATE && <UniversityCityComponent index={index} editIndex={editIndex}/>}
                            {watchEducation[index]?.institutionCity.length!=0 && <UniversityNameComponent index={index} editIndex={editIndex}/>}
                        </>
                    }
                    {(watchEducation[index]?.COUNTRY_CODE.id&&watchEducation[index]?.COUNTRY_CODE.id!='USA') && <UniversityNameComponent index={index} editIndex={editIndex}/>}
                    {yesNoOptions.map(yn => (
                        <Form.Group key={yn.id} as={Row} className="mb-1">
                            <Form.Label column md={3}>{yn.title}:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.${index}.${yn.id}`}
                                    defaultValue={defaultValues[yn.id]}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=="Y"} disabled={editIndex!=index}/>
                                            <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!="Y"} disabled={editIndex!=index}/>
                                        </>
                                    )}
                                />
                                {(editIndex==index&&checkYeNoOptions(yn.id)) &&
                                    <div>
                                        <small className="text-warning">Warning: At least one other education is set to yes.  If you save all others will be changed to no.</small>
                                    </div>
                                }
                            </Col>
                        </Form.Group>
                    ))}
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
            {fields.length>0&&canEdit&&
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Education</AppButton></Col>
                </Row>
            }
        </article>
    );
}

function DegreeProgramComponent({editIndex,index}) {
    const { control, setValue, formState: { errors } } = useFormContext();

    const { getListData } = useListsQueries();
    const programs = getListData('degreePrograms',{select:d=>{
        return d.map(p=>{return {id:p.DEGREE_PGM_CODE,label:p.DEGREE_PGM_DESC}});
    }});

    const handleBlur = (e,field) => {
        if (!field.value.length) setValue(field.name,[{customOption:true,label:e.target.value,id:'new-id-1'}]);
    }

    return (
        <Form.Group as={Row} className="mb-1">
            <Form.Label column md={3}>Degree Program/Major*:</Form.Label>
            <Col xs={12} md={8}>
                {programs.isError && <Loading isError error={programs.error}>Error Loading Degree Programs</Loading>}
                {programs.isLoading && <Loading>Loading Degree Programs</Loading>}
                {programs.data &&
                    <Controller
                        name={`${name}.${index}.DEGREE_PROGRAM`}
                        defaultValue=""
                        control={control}
                        render={({field}) => <Typeahead 
                            {...field} 
                            id={`degreeProgram-${index}`}
                            options={programs.data} 
                            flip={true} 
                            minLength={2} 
                            allowNew={true} 
                            selected={field.value||defaultValues.DEGREE_PROGRAM} 
                            onChange={field.onChange}
                            onBlur={e=>handleBlur(e,field)}
                            disabled={editIndex!=index}
                            isInvalid={!!get(errors,field.name,false)}
                        />}
                    />
                }
                <FormFieldErrorMessage fieldName={`${name}.${index}.DEGREE_PROGRAM`}/>
            </Col>
        </Form.Group>
    );
}

function UniversityCityComponent({editIndex,index}) {
    const { control, setValue, formState: { errors } } = useFormContext();
    const watchState = useWatch({name:`${name}.${index}.INSTITUTION_STATE`,control});

    const { getEducationInstitutions } = useFormQueries();
    const city = getEducationInstitutions({country:'USA',state:watchState,options:{
        enabled:(!!watchState),
        select: d => {
            return [...new Set(d.map(i=>i.INSTITUTION_CITY).sort())];
        }
    }});

    const handleChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.institutionName`,defaultValues.institutionName); // Clear Institution Name when City is changed
    }

    return (
        <Form.Group as={Row} className="mb-1">
            <Form.Label column md={3}>University/College City*:</Form.Label>
            <Col xs="auto">
                {city.isError && <Loading isError error={city.error}>Error Loading Cities</Loading>}
                {city.isLoading && <Loading>Loading Cities</Loading>}
                {city.data &&
                    <Controller
                        name={`${name}.${index}.institutionCity`}
                        defaultValue=""
                        control={control}
                        render={({field}) => <Typeahead 
                            {...field} 
                            id={`institutionCity-${index}`}
                            options={city.data} 
                            flip={true} 
                            minLength={2} 
                            allowNew={true} 
                            selected={field.value||defaultValues.institutionCity}
                            onChange={(e)=>handleChange(e,field)}
                            disabled={editIndex!=index}
                            isInvalid={!!get(errors,field.name,false)}
                        />}
                    />
                }
                <FormFieldErrorMessage  fieldName={`${name}.${index}.institutionCity`}/>
            </Col>
        </Form.Group>
    );
}

function UniversityNameComponent({editIndex,index}) {
    const { control, formState: { errors } } = useFormContext();
    const watchFields = useWatch({name:[
        `${name}.${index}.COUNTRY_CODE.id`,
        `${name}.${index}.INSTITUTION_STATE`
    ],control});

    const { getEducationInstitutions } = useFormQueries();
    const institutionName = getEducationInstitutions({country:watchFields[0],state:(watchFields[0]=='USA')?watchFields[1]:"",options:{
        select: d => {
            const instMap = new Map(); //used to ensure there are no duplicate, which will break typeahead
            d.forEach(i=>instMap.set(i.ID,i.INSTITUTION));
            const instArray = new Array();
            for (const[id,label] of instMap) {instArray.push({id:id,label:label});}
            return instArray;
        }
    }});
    return (
        <Form.Group as={Row} className="mb-1">
            <Form.Label column md={3}>University/College Name*:</Form.Label>
            <Col xs={12} md={8}>
                {institutionName.isError && <Loading isError error={institutionName.error}>Error Loading University/College Names</Loading>}
                {institutionName.isLoading && <Loading>Loading University/College Names</Loading>}
                {institutionName.data &&
                    <Controller
                        name={`${name}.${index}.institutionName`}
                        defaultValue=""
                        control={control}
                        render={({field}) => <Typeahead 
                            {...field} 
                            id={`institutionName-${index}`}
                            options={institutionName.data} 
                            flip={true} 
                            minLength={2} 
                            allowNew={true} 
                            selected={field.value||defaultValues.institutionName}
                            disabled={editIndex!=index}
                            isInvalid={!!get(errors,field.name,false)}
                        />}
                    />
                }
                <FormFieldErrorMessage fieldName={`${name}.${index}.institutionName`}/>
            </Col>
        </Form.Group>
    );
}