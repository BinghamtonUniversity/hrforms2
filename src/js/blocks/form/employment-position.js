import React, { useEffect, useState } from "react";
import { Row, Col, Form, Alert, InputGroup } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppButton, DateFormat, Loading } from "../components";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import { EmploymentPositionInfoBox, useHRFormContext } from "../../pages/form";
import { Icon } from "@iconify/react";

const name = 'employment.position';

export default function EmploymentPosition() {
    const { control, getValues } = useFormContext();
    const watchLookupFields = useWatch({name:['payroll.code',`${name}.LINE_ITEM_NUMBER`,'effDate'],control:control});

    const [showResults,setShowResults] = useState(!!getValues(`${name}.positionDetails.POSITION_ID`));

    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Position Details</Col>
            </Row>
            <EmploymentPositionSearch setShowResults={setShowResults}/>
            {showResults && <EmploymentPositionWrapper payroll={watchLookupFields[0]} lineNumber={watchLookupFields[1]} effDate={watchLookupFields[2]}/>}
        </article>
    );
}

function EmploymentPositionSearch({setShowResults}) {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();
    const handleSearch = () => {
        setShowResults(true);
    }
    const handleClear = () => {
        setShowResults(false);
        setValue(`${name}.LINE_ITEM_NUMBER`,'');
        setValue(`${name}.positionDetails`,{});
    }
    const handleKeyDown = e => e.key=='Enter' && handleSearch(e);
    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Position Search</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.LINE_ITEM_NUMBER`}
                        control={control}
                        render={({field})=><Form.Control {...field} type="search" onKeyDown={handleKeyDown} disabled={readOnly}/>}
                    />
                </Col>
            </Form.Group>
            {!readOnly &&
                <Row>
                    <Col className="button-group">
                        <AppButton format="search" className="mr-1" onClick={handleSearch}>Search</AppButton>
                        <AppButton format="clear" className="mr-1" onClick={handleClear}>Clear</AppButton>
                    </Col>
                </Row>
            }
        </section>
    );
}

function EmploymentPositionWrapper({payroll,lineNumber,effDate}) {
    const { setValue, getValues } = useFormContext();

    const { getPosition } = useFormQueries();
    const position = getPosition({
        payroll:payroll||'28020',
        lineNumber: lineNumber,
        effDate: effDate,
        options: {
            enabled:lineNumber!=getValues(`${name}.positionDetails.LINE_NUMBER`),
            onSuccess:d=>setValue(`${name}.positionDetails`,d),
            onError:e=>console.warn(e)
        }
    });
    return (
        <>
            {position.isLoading && <Loading type="alert" className="mt-3">Loading Line Number Details</Loading>}
            {position.isError && <Loading type="alert" className="mt-3" error={position.error} isError>Failed to load Line Number Details</Loading>}
            {position.isSuccess&&!position.data.POSITION_ID && 
                <Row className="mt-3">
                    <Col>
                        <Alert variant="danger" className="text-center">No Data Found for Line Number <strong>{lineNumber}</strong></Alert>
                    </Col>
                </Row>
            }
            {getValues(`${name}.positionDetails.POSITION_ID`) && 
                <>
                    <EmploymentPositionInfoBox as="alert"/>
                    <EmploymentAppointmentInformation data={position.data}/>
                </>
            }
        </>
    );
}

function EmploymentAppointmentInformation() {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();
    //TODO: get payroll and effDate from HRFormContext?
    const watchPayroll = useWatch({name:'payroll.code',control:control});
    const watchEffectiveDate = useWatch({name:`${name}.apptEffDate`,control:control,defaultValue:new Date(0)});
    const watchApptPercent = useWatch({name:`${name}.APPOINTMENT_PERCENT`,control:control})||100;
    const handleRangeChange = e => setValue(`${name}.APPOINTMENT_PERCENT`,e.target.value);
    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Appointment Information</Col>
            </Row>
            
            <AppointmentType/>
            
            <Form.Group as={Row}>
                <Form.Label column md={2}>Apointment Percent:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.APPOINTMENT_PERCENT`}
                        defaultValue="100"
                        control={control}
                        rules={{min:{value:1,message:'Appointment Percent cannot be less than 1%'},max:{value:100,message:'Appointment Percent cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={100} disabled={readOnly}/>}
                    />
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="apptPercentRange" id="apptPercentRange" min={1} max={100} value={watchApptPercent} onChange={handleRangeChange} disabled={readOnly}/>
                </Col>
            </Form.Group>

            <BenefitsFlag/>
            
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Effective Date:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <DateFormat nvl="Effective Date Not Set">{watchEffectiveDate}</DateFormat>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment End Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.APPOINTMENT_END_DATE`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                minDate={addDays(watchEffectiveDate,1)}
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
            {watchPayroll == '28020' && 
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Voluntary Reduction:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name={`${name}.VOLUNTARY_REDUCTION`}
                            defaultValue="N"
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
            
            <CheckSortCode/>
            <PositionJustification/>

        </section>
    );
}

function AppointmentType() {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();

    const { getListData } = useAppQueries();
    const appttypes = getListData('appointmentTypes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Appointment Type:</Form.Label>
            <Col xs="auto">
                {appttypes.isLoading && <Loading>Loading Data</Loading>}
                {appttypes.isError && <Loading isError>Failed to Load</Loading>}
                {appttypes.data &&
                    <Controller
                        name={`${name}.APPOINTMENT_TYPE.id`}
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                <option></option>
                                {appttypes.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
            </Col>
        </Form.Group>
    );
}
function BenefitsFlag() {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();
    const watchHasBenefits = useWatch({name:`${name}.hasBenefits`,control:control});
    
    const { getListData } = useAppQueries();
    const benefitcodes = getListData('benefitCodes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Benefits Flag:</Form.Label>
            <Col xs="auto">
                {benefitcodes.isLoading && <Loading>Loading Data</Loading>}
                {benefitcodes.isError && <Loading isError>Failed to Load</Loading>}
                {benefitcodes.data &&
                    <Controller
                        name={`${name}.BENEFIT_FLAG.id`}
                        control={control}
                        defaultValue="9"
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!watchHasBenefits||readOnly}>
                                {benefitcodes.data.map(b=><option key={b[0]} value={b[0]}>{b[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
            </Col>
        </Form.Group>
    );
}
function CheckSortCode() {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();

    const { getListData } = useAppQueries();
    const checksortcodes = getListData('checkSortCodes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Check Sort Codes:</Form.Label>
            <Col xs="auto">
                {checksortcodes.isLoading && <Loading>Loading Data</Loading>}
                {checksortcodes.isError && <Loading isError>Failed to Load</Loading>}
                {checksortcodes.data &&
                    <Controller
                        name={`${name}.PAYROLL_MAIL_DROP_ID.id`}
                        control={control}
                        defaultValue=""
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                <option></option>
                                {checksortcodes.data.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
                <Form.Text muted>Also known as Mail Drop ID</Form.Text>
            </Col>
        </Form.Group>
    );
}
function PositionJustification() {
    const { control, setValue } = useFormContext();
    const { readOnly } = useHRFormContext();

    const { getListData } = useAppQueries();
    const positionjustification = getListData('positionJustification');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Justification:</Form.Label>
            <Col xs="auto">
                {positionjustification.isLoading && <Loading>Loading Data</Loading>}
                {positionjustification.isError && <Loading isError>Failed to Load</Loading>}
                {positionjustification.data &&
                    <Controller
                        name={`${name}.justification.id`}
                        control={control}
                        defaultValue=""
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                <option></option>
                                {positionjustification.data.map(j=><option key={j[0]} value={j[0]}>{j[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
            </Col>
        </Form.Group>
    );
}