import React, { useEffect } from "react";
import { useAppQueries } from "../../queries";
import usePersonQueries from "../../queries/person";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading, CountrySelector } from "../components";

const name = 'person.demographics';

export default function PersonDemographics() {
    const { control, getValues, setValue, sunyId } = useFormContext();

    const watchCitizen = useWatch({name:`${name}.citizen`});
    const watchVeteran = useWatch({name:`${name}.veteran`});

    const {getPersonInfo} = usePersonQueries();
    //TODO: only fetch if not saved; saved data comes HRF2 table.
    const demographicsinfo = getPersonInfo(sunyId,'demographics',{
        refetchOnMount:false,
        enabled:!!sunyId
    });

    const {getListData} = useAppQueries();
    const gender = getListData('gender',{onSuccess:d=>{
        //const gender = getValues('person.demographics.gender.id');
        //if (gender) setValue('person.demographics.gender.value',d.find(g=>g[0]==gender)?.at(1)||'');
    }});

    const handleChangeGender = (e,field) => {
        field.onChange(e);
        setValue(`${name}.gender.value`,(e.target.value)?gender.data.find(g=>g[0]==e.target.value)[1]:'');
    }

    useEffect(() => {
        if (!demographicsinfo.data||!gender.data) return;
        //if (getValues('person.directory.loadDate.phone')) return;
        console.debug('setting demographic data...');
        setValue(`${name}.gender.id`,demographicsinfo.data?.at(0)?.GENDER);
        console.log(demographicsinfo.data);
        //setValue('person.directory.loadDate.phone',new Date());
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
                            name={`${name}.DOB`}
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
                        name={`${name}.citizen`}
                        defaultValue="Yes"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>

            {watchCitizen == 'No' && <PersonDemographicsNonUSCitizen/>}
            
            <PersonDemographicsMilitaryStatus/>

            <Form.Group as={Row}>
                <Form.Label column md={2}>Veteran:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <Controller
                        name={`${name}.veteran`}
                        defaultValue="Yes"
                        control={control}
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>

            {watchVeteran == 'Yes' && <PersonDemographicsVeteranDetails/>}
        </article>
    );
}

function PersonDemographicsMilitaryStatus() {
    const { control } = useFormContext();

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
                    render={({field}) => milstatus.data.map((s,i)=><Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.includes(s[0])} onChange={e=>handleChange(e,field)}/>)}
                />}
            </Col>
        </Form.Group>
    );
}

function PersonDemographicsNonUSCitizen() {
    const { control } = useFormContext();

    const watchCitizenType = useWatch({name:`${name}.citizenType`});

    const { getListData } = useAppQueries();
    const citizentype = getListData('nonUsCitizenType');
    const visatype = getListData('visaTypes');

    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Non-US Citizen Type:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.citizenType`}
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
                            name={`${name}.empAuthCardOnly`}
                            defaultValue="Yes"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
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
                        name={`${name}.citizenCountry`}
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
                        name={`${name}.visaType`}
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

function PersonDemographicsVeteranDetails() {
    const { control } = useFormContext();

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
                        render={({field}) => vetstatus.data.map(s=><Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.includes(s[0])} onChange={e=>handleChange(e,field)}/>)}
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
