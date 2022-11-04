import React, { useState } from "react";
import { Row, Col, Form, Alert, InputGroup } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppButton, DateFormat, Loading } from "../components";
import { useAppQueries } from "../../queries";
import useFormQueries from "../../queries/forms";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import { EmploymentPositionInfoBox } from "../../pages/form";
import { Icon } from "@iconify/react";

const name = 'employment.position';

export default function EmploymentPosition() {
    const { control, getValues } = useFormContext();
    const watchLookupFields = useWatch({name:['payroll.code',`${name}.lineNumber`,'effDate'],control:control});

    const [showResults,setShowResults] = useState(!!getValues(`${name}.lineNumberDetails.POSITION_ID`));

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
    const { control, getValues, setValue, formState: { errors } } = useFormContext();
    const handleSearch = () => {
        setShowResults(true);
    }
    const handleClear = () => {
        setShowResults(false);
        setValue(`${name}.lineNumber`,'');
        setValue(`${name}.lineNumberDetails`,{});
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
                        name={`${name}.lineNumber`}
                        control={control}
                        render={({field})=><Form.Control {...field} type="search" onKeyDown={handleKeyDown}/>}
                    />
                </Col>
            </Form.Group>
            <Row>
                <Col className="button-group">
                    <AppButton format="search" className="mr-1" onClick={handleSearch}>Search</AppButton>
                    <AppButton format="clear" className="mr-1" onClick={handleClear}>Clear</AppButton>
                </Col>
            </Row>
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
            enabled:lineNumber!=getValues(`${name}.lineNumberDetails.LINE_NUMBER`),
            onSuccess:d=>setValue(`${name}.lineNumberDetails`,d),
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
            {position.isSuccess&&position.data.POSITION_ID && 
                <>
                    <EmploymentPositionInfoBox/>
                    <EmploymentAppointmentInformation data={position.data}/>
                </>
            }
        </>
    );
}

function EmploymentAppointmentInformation() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    const watchPayroll = useWatch({name:'payroll.code',control:control});
    const watchEffectiveDate = useWatch({name:'effDate',control:control});
    const watchApptPercent = useWatch({name:`${name}.apptPercent`,control:control})||100;
    const handleRangeChange = e => setValue(`${name}.apptPercent`,e.target.value);
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
                        name={`${name}.apptPercent`}
                        defaultValue="100"
                        control={control}
                        rules={{min:{value:1,message:'Appointment Percent cannot be less than 1%'},max:{value:100,message:'Appointment Percent cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={100}/>}
                    />
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="apptPercentRange" id="apptPercentRange" min={1} max={100} value={watchApptPercent} onChange={handleRangeChange}/>
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
                            name="apptEndDate"
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                minDate={addDays(watchEffectiveDate||new Date(),1)}
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
            {watchPayroll == '28020' && 
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Voluntary Reduction:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name={`${name}.volReduction`}
                            defaultValue="No"
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
            
            <CheckSortCode/>
            <PositionJustification/>

        </section>
    );
}

function AppointmentType() {
    const { control } = useFormContext();
    const { getListData } = useAppQueries();
    const appttypes = getListData('appointmentTypes');
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Appointment Type:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.apptType`}
                    control={control}
                    render={({field}) => (
                        <Form.Control {...field} as="select">
                            <option></option>
                            {appttypes.data&&appttypes.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
        </Form.Group>
    );
}
function BenefitsFlag() {
    const { control } = useFormContext();
    const watchHasBenefits = useWatch({name:`${name}.hasBenefits`,control:control});
    const { getListData } = useAppQueries();
    const benefitCodes = getListData('benefitCodes');
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Benefits Flag:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.apptType`}
                    control={control}
                    defaultValue="9"
                    render={({field}) => (
                        <Form.Control {...field} as="select" disabled={!watchHasBenefits}>
                            {benefitCodes.data&&benefitCodes.data.map(b=><option key={b[0]} value={b[0]}>{b[1]}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
        </Form.Group>
    );
}
function CheckSortCode() {
    const { control } = useFormContext();
    const { getListData } = useAppQueries();
    const checkSortCodes = getListData('checkSortCodes');
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Check Sort Codes:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.checkSortCode`}
                    control={control}
                    defaultValue=""
                    render={({field}) => (
                        <Form.Control {...field} as="select">
                            <option></option>
                            {checkSortCodes.data&&checkSortCodes.data.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}
                        </Form.Control>
                    )}
                />
                <Form.Text muted>Also known as Mail Drop ID</Form.Text>
            </Col>
        </Form.Group>
    );
}
function PositionJustification() {
    const { control } = useFormContext();
    const { getListData } = useAppQueries();
    const positionJustification = getListData('positionJustification');
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Justification:</Form.Label>
            <Col xs="auto">
                <Controller
                    name={`${name}.justification`}
                    control={control}
                    defaultValue=""
                    render={({field}) => (
                        <Form.Control {...field} as="select">
                            <option></option>
                            {positionJustification.data&&positionJustification.data.map(j=><option key={j[0]} value={j[0]}>{j[1]}</option>)}
                        </Form.Control>
                    )}
                />
            </Col>
        </Form.Group>
    );
}