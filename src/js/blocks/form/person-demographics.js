import React from "react";
import { useAppQueries } from "../../queries";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext } from "../../pages/form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading, CountrySelector } from "../components";

const name = 'person.demographics';

export default function PersonDemographics() {
    const { control, setValue } = useFormContext();

    const watchCitizen = useWatch({name:`${name}.US_CITIZEN_INDICATOR`});
    const watchVeteran = useWatch({name:`${name}.VETERAN_INDICATOR`});

    const {getListData} = useAppQueries();
    const gender = getListData('gender');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <HRFormContext.Consumer>
            {({showInTest,readOnly}) => (
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
                                        disabled={readOnly}
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
                            {gender.isLoading && <Loading>Loading Data</Loading>}
                            {gender.isError && <Loading isError>Failed to Load</Loading>}
                            {gender.data &&
                                <Controller
                                    name={`${name}.GENDER.id`}
                                    control={control}
                                    render={({field})=>(
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                            <option></option>
                                            {gender.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
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
                                        <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={readOnly}/>
                                        <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'} disabled={readOnly}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Form.Group>

                    {(watchCitizen!='Y'||showInTest) && <PersonDemographicsNonUSCitizen handleSelectChange={handleSelectChange} watchCitizen={watchCitizen}/>}
                    
                    <PersonDemographicsMilitaryStatus/>

                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Veteran:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.VETERAN_INDICATOR`}
                                defaultValue="Yes"
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={readOnly}/>
                                        <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'} disabled={readOnly}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Form.Group>

                    {(watchVeteran=='Y'||showInTest) && <PersonDemographicsVeteranDetails watchVeteran={watchVeteran}/>}
                </article>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsMilitaryStatus() {
    const { control } = useFormContext();

    const {getListData} = useAppQueries();
    const milstatus = getListData('militaryStatus');

    const handleChange = (e,field) => {
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
    }
    return (
        <HRFormContext.Consumer>
            {({readOnly}) => (
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
                            render={({field}) => milstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.findIndex(v=>v[0]==s[0])!=-1} onChange={e=>handleChange(e,field)} disabled={readOnly}/>)}
                        />}
                    </Col>
                </Form.Group>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsNonUSCitizen({handleSelectChange,watchCitizen}) {
    const { control } = useFormContext();

    const watchCitizenType = useWatch({name:`${name}.NON_CITIZEN_TYPE`});

    const { getListData } = useAppQueries();
    const citizentype = getListData('nonUsCitizenType');
    const visatype = getListData('visaTypes');

    return (
        <HRFormContext.Consumer>
            {({showInTest,testHighlight,readOnly}) => (
                <>
                    <Form.Group as={Row} className={testHighlight(watchCitizen!='Y')}>
                        <Form.Label column md={2}>Non-US Citizen Type:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.NON_CITIZEN_TYPE.id`}
                                control={control}
                                render={({field})=>(
                                    <>
                                        {citizentype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                        {citizentype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                        {citizentype.data && 
                                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                                <option></option>
                                                {citizentype.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                            </Form.Control>
                                        }
                                    </>
                                )}
                            />
                        </Col>
                    </Form.Group>
                    {(watchCitizenType?.id=='OT'||showInTest) && 
                        <Form.Group as={Row} className={testHighlight(watchCitizen!='Y'&&watchCitizenType?.id=='OT')}>
                            <Form.Label column md={2}>Employment Authorization Card Only:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.EMP_AUTHORIZE_CARD_INDICATOR`}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={readOnly}/>
                                            <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'} disabled={readOnly}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                    }
                    <Form.Group as={Row} className={testHighlight(watchCitizen!='Y')}>
                        <Form.Label column md={2}>Country of Citizenship:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.CITIZENSHIP_COUNTRY_CODE.id`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <CountrySelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={readOnly}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className={testHighlight(watchCitizen!='Y')}>
                        <Form.Label column md={2}>Visa Type:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.VISA_CODE.id`}
                                control={control}
                                render={({field})=>(
                                <>
                                    {visatype.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                    {visatype.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                    {visatype.data &&
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                            <option></option>
                                            {visatype.data.map(k=><option key={k[0]} value={k[0]}>{k[0]} - {k[1]}</option>)}
                                        </Form.Control>
                                    }
                                </>)}
                            />
                        </Col>
                    </Form.Group>
                </>
            )}
        </HRFormContext.Consumer>
    );
}

function PersonDemographicsVeteranDetails({watchVeteran}) {
    const { control } = useFormContext();

    const { getListData } = useAppQueries();
    const vetstatus = getListData('protectedVeteranStatus');

    const handleChange = (e,field) => {
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
    }
    return (
        <HRFormContext.Consumer>
            {({testHighlight,readOnly}) => (
                <>
                    <Form.Group as={Row} className={testHighlight(watchVeteran=='Y')}>
                        <Form.Label column md={2}>Protected Veteran Status:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            {vetstatus.isLoading && <Loading>Loading Data</Loading>}
                            {vetstatus.isError && <Loading isError>Failed to Load</Loading>}
                            {vetstatus.data && 
                            <Controller
                                name={`${name}.protectedVetStatus`}
                                control={control}
                                render={({field}) => vetstatus.data.map(s=>s[0]&&<Form.Check key={s[0]} {...field} type="checkbox" label={s[1]} value={s[0]} checked={field.value.findIndex(v=>v[0]==s[0])!=-1} onChange={e=>handleChange(e,field)} disabled={readOnly}/>)}
                            />}
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className={testHighlight(watchVeteran=='Y')}>
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
                                        disabled={readOnly}
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
