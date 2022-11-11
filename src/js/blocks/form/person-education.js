import React, { useState, useCallback, useEffect } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";
import usePersonQueries from "../../queries/person";
import { get, cloneDeep } from "lodash";
import { AppButton, CountrySelector, DateFormat, StateSelector } from "../components";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import { Typeahead } from "react-bootstrap-typeahead";
import { Icon } from "@iconify/react";

const name = 'person.education.institutions';

const yesNoOptions = [
    {id:'highest',title:'Highest Degree',unique:true},
    {id:'terminal',title:'Terminal Degree',unique:true},
    {id:'verified',title:'Verified Degree',unique:false}
];

export default function PersonEducation() {
    const { control, getValues, setValue, trigger, clearErrors, sunyId, formState: { errors } } = useFormContext();
    const { fields, append, replace, remove, update } = useFieldArray({
        control:control,
        name:name
    });

    const {getPersonInfo} = usePersonQueries();
    //TODO: only fetch if not saved; saved data comes HRF2 table.
    const educationinfo = getPersonInfo(sunyId,'education',{
        refetchOnMount:false,
        enabled:!!sunyId
    });

    const watchEducation = useWatch({name:name,control});

    const [isNew,setIsNew] = useState(false);
    const [editIndex,setEditIndex] = useState();
    const [editValues,setEditValues] = useState();

    const {getListData} = useAppQueries();
    const degreeTypes = getListData('degreeTypes',{select:d=>{
        return d.map(degree=>{return {id:degree.DEGREE_TYPE_CODE,label:`${degree.DEGREE_TYPE_CODE} - ${degree.DEGREE_TYPE_DESC}`}});
    }});

    const handleNew = () => {
        if (fields.length > 2) return;
        append({
            awardDate:"",
            pending:false,
            type:[],
            specialization:"",
            country:"",
            state:"",
            city:[],
            name:[],
            highest:"no",
            terminal:"no",
            verified:"no",
            created:new Date()
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
                if (watchEducation.length > 1) {
                    yesNoOptions.filter(yn=>yn.unique).map(yn=>yn.id).forEach(k=>{
                        const m = watchEducation.map(e=>e[k]).filter(v=>v=='yes');
                        if (m.length > 1) {
                            m.forEach((v,i) => {
                                if (i != index) {
                                    const title = yesNoOptions.find(yn=>yn.id==k)?.title;
                                    const id = fields[i].id;
                                    console.warn(`Changing ${title} for Education index ${i} (id:${id}) to "no"`);
                                    setValue(`${name}.${i}.${k}`,'no');
                                }
                            });
                        }
                    });
                }
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

    const handlePendingChange = (e,field,index) => {
        field.onChange(e);
        setValue(`${name}.${index}.awardDate`,"");
    }
    const checkYeNoOptions = useCallback(key => {
        if (!yesNoOptions.find(yn=>yn.id==key)?.unique) return false;
        if (watchEducation.length < 2) return false;
        if (watchEducation.map(e=>e[key]).filter(v=>v=='yes').length>1) return true;
        return false;
    },[watchEducation,yesNoOptions]);

    useEffect(() => {
        if (!educationinfo.data||!degreeTypes.data) return;
        if (getValues('person.education.loadDate')) return;
        console.debug('setting education data...');
        const dataMap = [];
        educationinfo.data.forEach(d=>{
            const degree = degreeTypes.data.find(a=>a.id==d.DEGREE_TYPE);
            dataMap.push({
                awardDate:new Date(d.DEGREE_YEAR,(d.DEGREE_MONTH||1)-1),
                pending:d.ENDING_DEGREE_FLAG=='Y',
                type:[degree],
                specialization:"",
                country:d.COUNTRY_CODE,
                state:d.INSTITUTION_STATE,
                city:[d.INSTITUTION_CITY],
                name:[{id:d.INSTITUTION_ID,label:d.INSTITUTION}],
                highest:(d.HIGHEST_DEGREE_FLAG=='Y')?'yes':'no',
                terminal:(d.TERMINAL_DEGREE_FLAG=='Y')?'yes':'no',
                verified:(d.DEGREE_VERIFIED=='Y')?'yes':'no',
                created:new Date(d.CREATE_DATE)||new Date()
            });
        });
        replace(dataMap);
        setValue('person.education.loadDate',new Date());
    },[educationinfo.data,degreeTypes.data]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Education <AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New</AppButton></Col>
            </Row>
            {fields.map((flds,index)=>(
                <section key={flds.id} className="border rounded p-2 mb-2">
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Award Date*:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.${index}.awardDate`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Award Date Required'}}}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        closeOnScroll={true}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        minDate={get(watchEducation,`${index}.pending`,false)&&addDays(new Date(),1)}
                                        maxDate={!get(watchEducation,`${index}.pending`,false)&&new Date()}
                                        disabled={editIndex!=index}
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
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].awardDate`,false)?'block':'none'}}>{get(errors,`${name}[${index}].awardDate.message`,'')}</Form.Control.Feedback>
                        </Col>
                        <Col className="pt-2">
                            <Controller
                                name={`${name}.${index}.pending`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Check {...field} label="Pending Degree" onChange={e=>handlePendingChange(e,field,index)} checked={field.value} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Type*:</Form.Label>
                        <Col xs={12} md={8}>
                            {degreeTypes.isLoading && <p>Loading...</p>}
                            {degreeTypes.isError && <p>Error Loading</p>}
                            {degreeTypes.data &&
                                <Controller
                                    name={`${name}.${index}.type`}
                                    defaultValue=""
                                    control={control}
                                    rules={{required:{value:true,message:'Degree Type Required'}}}
                                    render={({field}) => <Typeahead 
                                        {...field} 
                                        id={`degreeType-${index}`}
                                        options={degreeTypes.data} 
                                        flip={true} 
                                        minLength={2} 
                                        allowNew={true} 
                                        selected={field.value}
                                        disabled={editIndex!=index}
                                        isInvalid={typeof get(errors,field.name,false) == 'object'}
                                    />}
                                />
                            }
                            <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].type`,false)?'block':'none'}}>{get(errors,`${name}[${index}].type.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>Degree Specialization:</Form.Label>
                        <Col xs={12} md={8}>
                            <Controller
                                name={`${name}.${index}.specialization`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} disabled={editIndex!=index}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-1">
                        <Form.Label column md={3}>University/College Country*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.${index}.country`}
                                defaultValue=""
                                control={control}
                                rules={{required:{value:true,message:'University/College Country Required'}}}
                                render={({field}) => <CountrySelector field={field} disabled={editIndex!=index} isInvalid={get(errors,field.name,false)}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].country.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    {watchEducation[index]?.country=='USA' &&
                        <>
                            <Form.Group as={Row} className="mb-1">
                                <Form.Label column md={3}>University/College State*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${index}.state`}
                                        defaultValue=""
                                        control={control}
                                        rules={{required:{value:true,message:'University/College State Required'}}}
                                        render={({field}) => <StateSelector field={field} disabled={editIndex!=index} isInvalid={get(errors,field.name,false)}/>}
                                    />
                                    <Form.Control.Feedback type="invalid">{get(errors,`${name}[${index}].state.message`,'')}</Form.Control.Feedback>
                                </Col>
                            </Form.Group>
                            {watchEducation[index]?.state && <UniversityCityComponent index={index} editIndex={editIndex}/>}
                            {watchEducation[index]?.city.length!=0 && <UniversityNameComponent index={index} editIndex={editIndex}/>}
                        </>
                    }
                    {(!!watchEducation[index]?.country&&watchEducation[index]?.country!='USA') && <UniversityNameComponent index={index} editIndex={editIndex}/>}
                    {yesNoOptions.map(yn => (
                        <Form.Group key={yn.id} as={Row} className="mb-1">
                            <Form.Label column md={3}>{yn.title}:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.${index}.${yn.id}`}
                                    defaultValue={false}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value="yes" checked={field.value=="yes"} disabled={editIndex!=index}/>
                                            <Form.Check {...field} inline type="radio" label="No" value="no" checked={field.value=="no"} disabled={editIndex!=index}/>
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
            {fields.length>0 &&
                <Row>
                    <Col><AppButton format="add" size="sm" onClick={handleNew} disabled={fields.length>2||editIndex!=undefined}>New Education</AppButton></Col>
                </Row>
            }
        </article>
    );
}

function UniversityCityComponent({editIndex,index}) {
    const { control, formState: { errors } } = useFormContext();
    const watchState = useWatch({name:`${name}.${index}.state`,control});

    const { getEducationInstitutions } = useFormQueries();
    const city = getEducationInstitutions({country:'USA',state:watchState,options:{
        select: d => {
            return [...new Set(d.map(i=>i.INSTITUTION_CITY).sort())];
        }
    }});
    return (
        <Form.Group as={Row} className="mb-1">
            <Form.Label column md={3}>University/College City*:</Form.Label>
            <Col xs="auto">
                {city.isLoading && <p>Loading...</p>}
                {city.isError && <p>Error Loading</p>}
                {city.data &&
                    <Controller
                        name={`${name}.${index}.city`}
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'University/College City Required'}}}
                        render={({field}) => <Typeahead 
                            {...field} 
                            id={`city-${index}`}
                            options={city.data} 
                            flip={true} 
                            minLength={2} 
                            allowNew={true} 
                            selected={field.value}
                            disabled={editIndex!=index}
                            isInvalid={typeof get(errors,field.name,false) == 'object'}
                        />}
                    />
                }
                <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].city`,false)?'block':'none'}}>{get(errors,`${name}[${index}].city.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}

function UniversityNameComponent({editIndex,index}) {
    const { control, formState: { errors } } = useFormContext();
    const watchFields = useWatch({name:[
        `${name}.${index}.country`,
        `${name}.${index}.state`,
        `${name}.${index}.city`
    ],control});

    const { getEducationInstitutions } = useFormQueries();
    const institutionName = getEducationInstitutions({country:watchFields[0],state:watchFields[1],options:{
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
                {institutionName.isLoading && <p>Loading...</p>}
                {institutionName.isError && <p>Error Loading</p>}
                {institutionName.data &&
                    <Controller
                        name={`${name}.${index}.name`}
                        defaultValue=""
                        control={control}
                        rules={{required:{value:true,message:'University/College Name Required'}}}
                        render={({field}) => <Typeahead 
                            {...field} 
                            id={`name-${index}`}
                            options={institutionName.data} 
                            flip={true} 
                            minLength={2} 
                            allowNew={true} 
                            selected={field.value}
                            disabled={editIndex!=index}
                            isInvalid={typeof get(errors,field.name,false) == 'object'}
                        />}
                    />
                }
                <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}[${index}].name`,false)?'block':'none'}}>{get(errors,`${name}[${index}].name.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}