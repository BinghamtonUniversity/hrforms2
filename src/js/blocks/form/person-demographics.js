import React, { useCallback, useEffect } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext, useHRFormContext } from "../../config/form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading, CountrySelector } from "../components";
import useListsQueries from "../../queries/lists";
import { get } from "lodash";
import { FormFieldErrorMessage } from "../../pages/form";

const name = 'person.demographics';
const idName = 'personDemographics';

export default function PersonDemographics() {
    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit, activeNav } = useHRFormContext();

    const watchCitizen = useWatch({name:`${name}.US_CITIZEN_INDICATOR`});
    const watchVeteran = useWatch({name:`${name}.VETERAN_INDICATOR`});

    const {getListData} = useListsQueries();
    const legalsex = getListData('legalSex');
    const gender = getListData('gender');
    const education = getListData('highestEducation');

    const handleSelectChange = useCallback((e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    },[setValue]);
    useEffect(()=>{
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);
    return (
        <HRFormContext.Consumer>
            {({showInTest,canEdit}) => (
                <article className="mt-3">
                    <Row as="header">
                        <Col as="h3">Demographics</Col>
                    </Row>
                    <Form.Group as={Row} controlId={`${idName}BirthDate`}>
                        <Form.Label column md={2}>Date of Birth*:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.birthDate`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.birthDate`]}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        selected={field.value||getValues('lookup.values.dob')}
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
                            <FormFieldErrorMessage fieldName={`${name}.birthDate`}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId={`${idName}LegalSex`}>
                        <Form.Label column md={2}>Legal Sex*:</Form.Label>
                        <Col xs="auto">
                            {legalsex.isLoading && <Loading>Loading Data</Loading>}
                            {legalsex.isError && <Loading isError>Failed to Load</Loading>}
                            {legalsex.data &&
                                <Controller
                                    name={`${name}.GENDER.id`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.GENDER`]}
                                    render={({field})=>(
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                            <option></option>
                                            {legalsex.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                            <FormFieldErrorMessage fieldName={`${name}.GENDER.id`}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId={`${idName}GenderIdentity`}>
                        <Form.Label column md={2}>Gender Identity:</Form.Label>
                        <Col xs="auto">
                            {gender.isLoading && <Loading>Loading Data</Loading>}
                            {gender.isError && <Loading isError>Failed to Load</Loading>}
                            {gender.data &&
                                <Controller
                                    name={`${name}.GENDER_IDENTITY.id`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.GENDER_IDENTITY`]}
                                    render={({field})=>(
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                            <option></option>
                                            {gender.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId={`${idName}Education`}>
                        <Form.Label column md={2}>Highest Education Level:</Form.Label>
                        <Col xs="auto">
                            {education.isLoading && <Loading>Loading Data</Loading>}
                            {education.isError && <Loading isError>Failed to Load</Loading>}
                            {education.data &&
                                <Controller
                                    name={`${name}.HIGHEST_EDUCATION_LEVEL.id`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.HIGHEST_EDUCATION_LEVEL`]}
                                    render={({field})=>(
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                            <option></option>
                                            {education.data.map(k=><option key={k.CODE_VALUE} value={k.CODE_VALUE}>{k.LONG_DSC}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                        </Col>
                    </Form.Group>
                    <Row as="fieldset" className="mb-2">
                        <Col md={2}>
                            <legend className="form-label col-form-label">US Citizen*:</legend>
                        </Col>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.US_CITIZEN_INDICATOR`}
                                defaultValue={defaultValues[`${name}.US_CITIZEN_INDICATOR`]}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline id={`${idName}USCitizen-yes`} type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={!canEdit}/>
                                        <Form.Check {...field} inline id={`${idName}USCitizen-no`} type="radio" label="No" value='N' checked={field.value!='Y'} disabled={!canEdit}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Row>

                    {(watchCitizen!='Y'||showInTest) && <PersonDemographicsNonUSCitizen handleSelectChange={handleSelectChange} watchCitizen={watchCitizen}/>}
                    
                    <PersonDemographicsMilitaryStatus/>

                    <Row as="fieldset" className="mb-2">
                        <Col md={2}>
                            <legend className="form-label col-form-label">Veteran:</legend>
                        </Col>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.VETERAN_INDICATOR`}
                                defaultValue={defaultValues[`${name}.VETERAN_INDICATOR`]}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline id={`${idName}Veteran-yes`} type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={!canEdit}/>
                                        <Form.Check {...field} inline id={`${idName}Veteran-no`} type="radio" label="No" value='N' checked={field.value!='Y'} disabled={!canEdit}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Row>

                    {(watchVeteran=='Y'||showInTest) && <PersonDemographicsVeteranDetails watchVeteran={watchVeteran}/>}
                </article>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsMilitaryStatus() {
    const { control, formState: { defaultValues } } = useFormContext();

    const {getListData} = useListsQueries();
    const milstatus = getListData('militaryStatus');

    const handleChange = useCallback((e,field) => {
        if (!milstatus.data) return;
        if (e.target.checked) {
            if (e.target.value == 'N') {
                field.onChange([milstatus.data.find(s=>s[0]=='N')]);
            } else {
                field.onChange([...field.value.filter(v=>v[0]!='N'),milstatus.data.find(s=>s[0]==e.target.value)]);
            }
        } else {
            field.onChange(field.value.filter(v=>v[0]!==e.target.value));
        }
    },[milstatus]);
    return (
        <HRFormContext.Consumer>
            {({canEdit}) => (
                <Row as="fieldset" className="mb-2">
                    <Col md={2}>
                        <legend className="form-label col-form-label">Military Status:</legend>
                    </Col>
                    <Col xs="auto" className="pt-2">
                        {milstatus.isLoading && <Loading>Loading Data</Loading>}
                        {milstatus.isError && <Loading isError>Failed to Load</Loading>}
                        {milstatus.data && 
                        <Controller
                            name={`${name}.militaryStatus`}
                            defaultValue={defaultValues[`${name}.militaryStatus`]}
                            control={control}
                            render={({field}) => milstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} id={`${idName}MilitaryStatus-${s[0]}`} type="checkbox" label={s[1]} value={s[0]} checked={field.value.findIndex(v=>v[0]==s[0])!=-1} onChange={e=>handleChange(e,field)} disabled={!canEdit}/>)}
                        />}
                    </Col>
                </Row>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsNonUSCitizen({handleSelectChange,watchCitizen}) {
    const { control, formState: { defaultValues, errors } } = useFormContext();

    const watchCitizenType = useWatch({name:`${name}.NON_CITIZEN_TYPE`});

    const {getListData} = useListsQueries();
    const citizentype = getListData('nonUsCitizenType');
    const visatype = getListData('visaTypes');

    return (
        <HRFormContext.Consumer>
            {({showInTest,testHighlight,canEdit}) => (
                <>
                    <Form.Group as={Row} className={testHighlight(watchCitizen!='Y')} controlId={`${idName}CitizenType`}>
                        <Form.Label column md={2}>Non-US Citizen Type*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.NON_CITIZEN_TYPE.id`}
                                control={control}
                                defaultValue={defaultValues[`${name}.NON_CITIZEN_TYPE`]}
                                render={({field})=>(
                                    <>
                                        {citizentype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                        {citizentype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                        {citizentype.data && 
                                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                                <option></option>
                                                {citizentype.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                            </Form.Control>
                                        }
                                    </>
                                )}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.NON_CITIZEN_TYPE.id`}/>
                        </Col>
                    </Form.Group>
                    {(watchCitizenType?.id=='OT'||showInTest) && 
                        <Row as="fieldset" className={`mb-2 ${testHighlight(watchCitizen!='Y'&&watchCitizenType?.id=='OT')}`}>
                            <Col md={2}>
                                <legend className="form-label col-form-label">Military Status:</legend>
                            </Col>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.EMP_AUTHORIZE_CARD_INDICATOR`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.EMP_AUTHORIZE_CARD_INDICATOR`]}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" id={`${idName}EmpAuthCard-yes`} label="Yes" value='Y' checked={field.value=='Y'} disabled={!canEdit}/>
                                            <Form.Check {...field} inline type="radio" id={`${idName}EmpAuthCard-no`} label="No" value='N' checked={field.value!='Y'} disabled={!canEdit}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Row>
                    }
                    <Form.Group as={Row} className={testHighlight(watchCitizen!='Y')} controlId={`${idName}CitizenCountry`}>
                        <Form.Label column md={2}>Country of Citizenship*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.CITIZENSHIP_COUNTRY_CODE.id`}
                                defaultValue={defaultValues[`${name}.CITIZENSHIP_COUNTRY_CODE`]}
                                control={control}
                                render={({field}) => <CountrySelector field={field} onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                            />
                            <FormFieldErrorMessage fieldName={`${name}.CITIZENSHIP_COUNTRY_CODE.id`}/>
                        </Col>
                    </Form.Group>
                    {(watchCitizenType?.id=='NC'||showInTest) && 
                        <Form.Group as={Row} className={testHighlight(watchCitizen!='Y'&&watchCitizenType?.id=='NC')} controlId={`${idName}VisaType`}>
                            <Form.Label column md={2}>Visa Type*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.VISA_CODE.id`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.VISA_CODE`]}
                                    render={({field})=>(
                                    <>
                                        {visatype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                        {visatype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                        {visatype.data &&
                                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                                <option></option>
                                                {visatype.data.map(k=><option key={k[0]} value={k[0]}>{k[0]} - {k[1]}</option>)}
                                            </Form.Control>
                                        }
                                    </>)}
                                />
                                <FormFieldErrorMessage fieldName={`${name}.VISA_CODE.id`}/>
                            </Col>
                        </Form.Group>
                    }
                </>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsVeteranDetails({watchVeteran}) {
    const { control, formState: { defaultValues } } = useFormContext();

    const {getListData} = useListsQueries();
    const vetstatus = getListData('protectedVeteranStatus');

    const handleChange = useCallback((e,field) => {
        if (!vetstatus.data) return;
        if (e.target.checked) {
            if (e.target.value == 'N') {
                field.onChange([vetstatus.data.find(s=>s[0]=='N')]);
            } else {
                field.onChange([...field.value.filter(v=>v[0]!='N'),vetstatus.data.find(s=>s[0]==e.target.value)]);
            }
        } else {
            field.onChange(field.value.filter(v=>v[0]!==e.target.value));
        }
    },[vetstatus]);
    return (
        <HRFormContext.Consumer>
            {({testHighlight,canEdit}) => (
                <>
                    <Row as="fieldset" className={`mb-2 ${testHighlight(watchVeteran=='Y')}`}>
                        <Col md={2}>
                            <legend className="form-label col-form-label">Protected Veteran Status:</legend>
                        </Col>
                        <Col xs="auto" className="pt-2">
                            {vetstatus.isLoading && <Loading>Loading Data</Loading>}
                            {vetstatus.isError && <Loading isError>Failed to Load</Loading>}
                            {vetstatus.data && 
                            <Controller
                                name={`${name}.protectedVetStatus`}
                                control={control}
                                defaultValue={defaultValues[`${name}.protectedVetStatus`]}
                                render={({field}) => vetstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} id={`${idName}ProtectedVetStatus-${s[0]}`} type="checkbox" label={s[1]} value={s[0]} checked={field.value.findIndex(v=>v[0]==s[0])!=-1} onChange={e=>handleChange(e,field)} disabled={!canEdit}/>)}
                            />}
                        </Col>
                    </Row>
                    <Form.Group as={Row} className={testHighlight(watchVeteran=='Y')} controlId={`${idName}MilitarySepDate`}>
                        <Form.Label column md={2}>Military Separation Date:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.militarySepDate`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.militarySepDate`]}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        selected={field.value}
                                        closeOnScroll={true}
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={!canEdit}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                    </Form.Group>
                </>
            )}
        </HRFormContext.Consumer>
    );
}
