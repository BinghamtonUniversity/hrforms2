import React, { useEffect } from "react";
import { useAppQueries } from "../../queries";
import usePersonQueries from "../../queries/person";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading, CountrySelector } from "../components";
import { isValid } from "date-fns";

const name = 'person.demographics';

export default function PersonDemographics() {
    const { control, getValues, setValue } = useFormContext();

    const watchCitizen = useWatch({name:`${name}.US_CITIZEN_INDICATOR`});
    const watchVeteran = useWatch({name:`${name}.VETERAN_INDICATOR`});

    const {getListData} = useAppQueries();
    const gender = getListData('gender');

    const handleChangeGender = (e,field) => {
        field.onChange(e);
        setValue(`${name}.gender.value`,(e.target.value)?gender.data.find(g=>g[0]==e.target.value)[1]:'');
    }

    useEffect(() => {
        if (!demographicsinfo.data||!gender.data) return;
        if (getValues(`${name}.loadDate.demo`)) return;
        console.debug('setting demographic data...');
        const dob = new Date(demographicsinfo.data?.BIRTH_DATE);
        setValue(`${name}.DOB`,isValid(dob)?dob:"");
        setValue(`${name}.gender.id`,demographicsinfo.data?.GENDER);
        setValue(`${name}.citizen`,(demographicsinfo.data?.US_CITIZEN_INDICATOR=="Y")?"Yes":"No");
        setValue(`${name}.empAuthCardOnly`,(demographicsinfo.data?.EMP_AUTHORIZE_CARD_INDICATOR=="Y")?"Yes":"No");
        setValue(`${name}.citizenCountry`,demographicsinfo.data?.CITIZENSHIP_COUNTRY_CODE);
        setValue(`${name}.citizenType`,demographicsinfo.data?.NON_CITIZEN_TYPE);
        setValue(`${name}.visaType`,demographicsinfo.data?.VISA_CODE);
        setValue(`${name}.veteran`,(demographicsinfo.data?.VETERAN_INDICATOR=="Y")?"Yes":"No");
        setValue(`${name}.loadDate.demo`,new Date());
    },[demographicsinfo.data,gender.data]);

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Demographics</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Date of Birth:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.birthDate`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                autoComplete="off"
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
            <Form.Group as={Row}>
                <Form.Label column md={2}>Gender:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.gender.id`}
                        control={control}
                        render={({field})=>(
                            <>
                                {gender.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                {gender.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                {gender.data &&
                                    <Form.Control {...field} as="select" onChange={e=>handleChangeGender(e,field)}>
                                        <option></option>
                                        {gender.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                    </Form.Control>
                                }
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>US Citizen:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name={`${name}.US_CITIZEN_INDICATOR`}
                        defaultValue="Yes"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'}/>
                                <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>

            {watchCitizen == 'No' && <PersonDemographicsNonUSCitizen/>}
            
            <PersonDemographicsMilitaryStatus data={demographicsinfo.data}/>

            <Form.Group as={Row}>
                <Form.Label column md={2}>Veteran:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name={`${name}.VETERAN_INDICATOR`}
                        defaultValue="Yes"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'}/>
                                <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>

            {watchVeteran == 'Yes' && <PersonDemographicsVeteranDetails data={demographicsinfo.data}/>}
        </article>
    );
}

function PersonDemographicsMilitaryStatus({data}) {
    const { control, getValues, setValue } = useFormContext();

    const {getListData} = useAppQueries();
    const milstatus = getListData('militaryStatus');

    const handleChange = (e,field) => {
        if (e.target.checked) {
            if (e.target.value == 'N') {
                field.onChange(['N']);
            } else {
                field.onChange([...field.value.filter(v=>v!='N'),e.target.value]);
            }
        } else {
            field.onChange(field.value.filter(v=>v!==e.target.value))
        }
    }
    useEffect(() => {
        if (!data || !milstatus.data) return;
        if (getValues(`${name}.loadDate.milStatus`)) return;
        const milStatusArray = [];
        const milStatusCode = data?.MILITARY_STATUS_CODE;
        if (milStatusCode) milStatusCode.split('').forEach((c,i)=>c==1&&milStatusArray.push(milstatus.data?.at(i)?.at(0)));
        if (!milStatusArray.length) milStatusArray.push('N'); // add "N":"None" if no option is selected
        setValue(`${name}.militaryStatus`,milStatusArray);
        setValue(`${name}.loadDate.milStatus`,new Date());
    },[data,milstatus.data]);

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Military Status:</Form.Label>
            <Col xs="auto" className="pt-2">
                {milstatus.isLoading && <Loading>Loading Data</Loading>}
                {milstatus.isError && <Loading isError>Failed to Load</Loading>}
                {milstatus.data && 
                <Controller
                    name={`${name}.militaryStatus`}
                    defaultValue="Yes"
                    control={control}
                    render={({field}) => milstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.includes(s[0])} onChange={e=>handleChange(e,field)}/>)}
                />}
            </Col>
        </Form.Group>
    );
}

function PersonDemographicsNonUSCitizen() {
    const { control } = useFormContext();

    const watchCitizenType = useWatch({name:`${name}.NON_CITIZEN_TYPE`});

    const { getListData } = useAppQueries();
    const citizentype = getListData('NON_CITIZEN_TYPE');
    const visatype = getListData('visaTypes');

    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Non-US Citizen Type:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.NON_CITIZEN_TYPE`}
                        control={control}
                        render={({field})=>(
                            <>
                                {citizentype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                {citizentype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                {citizentype.data && 
                                    <Form.Control {...field} as="select">
                                        <option></option>
                                        {citizentype.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                    </Form.Control>
                                }
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            {watchCitizenType == 'OT' && 
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Employment Authorization Card Only:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name={`${name}.EMP_AUTHORIZE_CARD_INDICATOR`}
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Country of Citizenship:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.CITIZENSHIP_COUNTRY_CODE`}
                        defaultValue=""
                        control={control}
                        render={({field}) => <CountrySelector field={field}/>}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Visa Type:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.VISA_CODE`}
                        control={control}
                        render={({field})=>(
                        <>
                            {visatype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                            {visatype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                            {visatype.data &&
                                <Form.Control {...field} as="select">
                                    <option></option>
                                    {visatype.data.map(k=><option key={k[0]} value={k[0]}>{k[0]} - {k[1]}</option>)}
                                </Form.Control>
                            }
                        </>)}
                    />
                </Col>
            </Form.Group>
        </>
    );
}

function PersonDemographicsVeteranDetails({data}) {
    const { control, getValues, setValue } = useFormContext();

    const { getListData } = useAppQueries();
    const vetstatus = getListData('protectedVeteranStatus');

    const handleChange = (e,field) => {
        if (e.target.checked) {
            if (e.target.value == 'N') {
                field.onChange(['N']);
            } else {
                field.onChange([...field.value.filter(v=>v!='N'),e.target.value]);
            }
        } else {
            field.onChange(field.value.filter(v=>v!==e.target.value))
        }
    }
    
    useEffect(() => {
        if (!data || !vetstatus.data) return;
        if (getValues(`${name}.loadDate.vetStatus`)) return;
        const vetStatusArray = [];
        const vetStatusCode = data?.PROTECTED_VET_STATUS_CODE;
        if (vetStatusCode) vetStatusCode.split('').forEach((c,i)=>c==1&&vetStatusArray.push(vetstatus.data?.at(i)?.at(0)));
        if (!vetStatusArray.length) vetStatusArray.push('N'); // add "N":"Not a Proteced Veteran" if no other option is selected
        setValue(`${name}.protectedVetStatus`,vetStatusArray);
        const milSepDate = new Date(data?.MILITARY_SEPARATION_DATE);
        setValue(`${name}.militarySepDate`,isValid(milSepDate)?milSepDate:"");
        setValue(`${name}.loadDate.vetStatus`,new Date());
    },[data,vetstatus.data]);

    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Protected Veteran Status:</Form.Label>
                <Col xs="auto" className="pt-2">
                    {vetstatus.isLoading && <Loading>Loading Data</Loading>}
                    {vetstatus.isError && <Loading isError>Failed to Load</Loading>}
                    {vetstatus.data && 
                    <Controller
                        name={`${name}.protectedVetStatus`}
                        control={control}
                        render={({field}) => vetstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.includes(s[0])} onChange={e=>handleChange(e,field)}/>)}
                    />}
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Military Separation Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.militarySepDate`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                autoComplete="off"
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
    )
}
