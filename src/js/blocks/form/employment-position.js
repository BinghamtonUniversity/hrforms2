import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Form, Alert, InputGroup, OverlayTrigger, Popover, Table } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppButton, Loading } from "../components";
import useFormQueries from "../../queries/forms";
import DatePicker from "react-datepicker";
import { addDays } from "date-fns";
import { EmploymentPositionInfoBox } from "../../pages/form";
import { useHRFormContext } from "../../config/form";
import { Icon } from "@iconify/react";
import useListsQueries from "../../queries/lists";
import { defaultTo, get } from "lodash";

const name = 'employment.position';

export default function EmploymentPosition() {
    const { control, getValues } = useFormContext();
    const watchLookupFields = useWatch({name:['payroll.PAYROLL_CODE',`${name}.LINE_ITEM_NUMBER`,'effDate'],control:control});

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
    const ref = useRef();

    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit, activeNav } = useHRFormContext();

    const handleSearch = () => setShowResults(true);
    const handleClear = () => {
        setShowResults(false);
        setValue(`${name}.LINE_ITEM_NUMBER`,'');
        setValue(`${name}.positionDetails`,{});
    }
    const handleKeyDown = e => {
        if (e.key=='Enter') {
            handleSearch(e);
        } else {
            setShowResults(false);
        }
    }
    const handleChange = (field,e) => {
        if (e.target.value=='') setShowResults(false);
        field.onChange(e);
    }

    const handleTableClick = e => {
        if (e.target.nodeName != 'TD') return;
        const lineNum = e.target.parentElement.children[0].textContent;
        setValue(`${name}.LINE_ITEM_NUMBER`,lineNum);
        handleSearch();
    }

    useEffect(() => (canEdit&&ref.current)&&ref.current.focus(),[activeNav]);
   
    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Position Search</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.LINE_ITEM_NUMBER`}
                        defaultValue={defaultValues[`${name}.LINE_ITEM_NUMBER`]}
                        control={control}
                        render={({field})=><Form.Control {...field} ref={ref} type="search" onKeyDown={handleKeyDown} onChange={e=>handleChange(field,e)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.LINE_ITEM_NUMBER.message`,'')}</Form.Control.Feedback>
                </Col>
                <Col xs="auto" className="p-0 align-self-center">
                    <OverlayTrigger
                        placement="auto"
                        trigger="click"
                        rootClose
                        flip={true}
                        overlay={
                            <Popover id="lineNumber-help">
                                <Popover.Title as="h3" style={{fontSize:'1.2rem'}}>Line Number Search Help</Popover.Title>
                                <Popover.Content>
                                    <article>
                                        <header>
                                            <h4 style={{fontSize:'1rem'}}>Generic Line Numbers:</h4>
                                        </header>
                                        <Table size="sm" className="table-row-clickable mb-0" striped bordered hover onClick={e=>handleTableClick(e)}>
                                            <thead>
                                                <tr>
                                                    <th scope="col">Line#</th>
                                                    <th scope="col">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>20000</td>
                                                    <td>Student Assistant</td>
                                                </tr>
                                                <tr>
                                                    <td>46200</td>
                                                    <td>Sum/Win Session Instructor (CSL)</td>
                                                </tr>
                                                <tr>
                                                    <td>48100</td>
                                                    <td>Sum/Win Session Adjunct Lecturer</td>
                                                </tr>
                                                <tr>
                                                    <td>80000</td>
                                                    <td>Federal College Work Study</td>
                                                </tr>
                                                <tr>
                                                    <td>90000</td>
                                                    <td>Teaching Assistant</td>
                                                </tr>
                                                <tr>
                                                    <td>92000</td>
                                                    <td>Graduate Assistant</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                        <p className="font-size-85 font-italic my-1">*click row to select</p>
                                    </article>
                                </Popover.Content>
                            </Popover>
                        }
                    >
                        <AppButton size="sm" format="info" variant="outline-primary"/>
                    </OverlayTrigger>
                </Col>
            </Form.Group>
            {canEdit &&
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
    const [positionId,setPositionId] = useState('');
    const { setValue, getValues } = useFormContext();

    const { getPosition } = useFormQueries();
    const position = getPosition({
        payroll:payroll||'28020',
        lineNumber: lineNumber,
        effDate: effDate,
        options: {
            enabled:lineNumber!=getValues(`${name}.positionDetails.LINE_NUMBER`),
            onSuccess:d=>{
                setValue(`${name}.positionDetails`,d);
                setValue(`${name}.APPOINTMENT_PERCENT`,d.POSITION_PERCENT);
                setPositionId(d.POSITION_ID);
            },
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
            {positionId && 
                <>
                    <EmploymentPositionInfoBox as="alert"/>
                    <EmploymentAppointmentInformation/>
                </>
            }
        </>
    );
}

function EmploymentAppointmentInformation() {
    const { control, setValue, getValues, formState: { defaultValues } } = useFormContext();
    const { canEdit, showInTest, testHighlight } = useHRFormContext();
    const watchPayroll = useWatch({name:'payroll.PAYROLL_CODE',control:control});
    const watchEffectiveDate = useWatch({name:`${name}.apptEffDate`,control:control,defaultValue:new Date(0)});
    const watchApptPercent = useWatch({name:`${name}.APPOINTMENT_PERCENT`,control:control});

    const maxPercent = useMemo(()=>defaultTo(getValues(`${name}.positionDetails.POSITION_PERCENT`),100),[]);
    const getMinDate = useMemo(()=>(!watchEffectiveDate)?addDays(new Date(),-1):addDays(watchEffectiveDate,1),[watchEffectiveDate]);

    const handleAppointmentPercent = (e,field) => {
        //const max = maxPercent || 100;
        switch (e.type) {
            case "change":
                if (e.target.value != "" && (parseInt(e.target.value,10) < 0 || parseInt(e.target.value,10) > maxPercent)) return false;
                field.onChange(e);
                break;
            case "blur":
                if (!e.target.value) setValue(field.name,max);
        }
    }
    const handleRangeChange = e => setValue(`${name}.APPOINTMENT_PERCENT`,e.target.value);


    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Appointment Information</Col>
            </Row>
            
            <AppointmentType/>
            
            <Form.Group as={Row}>
                <Form.Label column md={2}>Apointment Percent*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.APPOINTMENT_PERCENT`}
                        defaultValue={maxPercent}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={maxPercent} disabled={!canEdit} onBlur={e=>handleAppointmentPercent(e,field)} onChange={e=>handleAppointmentPercent(e,field)}/>}
                    />
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="apptPercentRange" id="apptPercentRange" min={1} max={maxPercent} value={watchApptPercent} onChange={handleRangeChange} disabled={!canEdit} list="markers"/>
                    <datalist id="markers" className="marker">
                        <option value="1">1%</option>
                        {[.25,.5,.75].map(r => {
                            const pct = Math.round(parseInt(maxPercent,10)*r,0);
                            return <option key={pct} value={pct}></option>;
                        })}
                        <option value={maxPercent}>{maxPercent}%</option>
                    </datalist>
                </Col>
            </Form.Group>

            <BenefitsFlag/>
            
            {/* REMOVED: 3/27/2025 per discussion with HR
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment Effective Date:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <DateFormat nvl="Effective Date Not Set">{watchEffectiveDate}</DateFormat>
                </Col>
            </Form.Group>
            */}
            
            <Form.Group as={Row}>
                <Form.Label column md={2}>Appointment End Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.apptEndDate`}
                            defaultValue={defaultValues[`${name}.apptEndDate`]}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                minDate={getMinDate}
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
            {(watchPayroll=='28020'||showInTest) && 
                <Form.Group as={Row} className={testHighlight(watchPayroll=='28020')}>
                    <Form.Label column md={2}>Voluntary Reduction:</Form.Label>
                    <Col xs="auto" className="pt-2">
                        <Controller
                            name={`${name}.VOLUNTARY_REDUCTION`}
                            defaultValue={defaultValues[`${name}.VOLUNTARY_REDUCTION`]}
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Y' checked={field.value=='Y'} disabled={!canEdit}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='N' checked={field.value!='Y'} disabled={!canEdit}/>
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
    const { control, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit } = useHRFormContext();

    const { getListData } = useListsQueries();
    const appttypes = getListData('appointmentTypes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Appointment Type*:</Form.Label>
            <Col xs="auto">
                {appttypes.isLoading && <Loading>Loading Data</Loading>}
                {appttypes.isError && <Loading isError>Failed to Load</Loading>}
                {appttypes.data &&
                    <Controller
                        name={`${name}.APPOINTMENT_TYPE.id`}
                        defaultValue={defaultValues[`${name}.APPOINTMENT_TYPE`]}
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                <option></option>
                                {appttypes.data.map(t=><option key={t[0]} value={t[0]}>{t[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
                <Form.Control.Feedback type="invalid">{get(errors,`${name}.APPOINTMENT_TYPE.id.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}
function BenefitsFlag() {
    const { control, getValues, setValue, formState: { defaultValues } } = useFormContext();
    const { canEdit } = useHRFormContext();
    const watchHasBenefits = useWatch({name:'payroll.ADDITIONAL_INFO.hasBenefits',control:control});
    //const watchPayroll = useWatch({name:'payroll.PAYROLL_CODE',control:control});
    
    const { getListData } = useListsQueries();
    const benefitcodes = getListData('benefitCodes',{
        // Only show benefit code 'T' for payrol 28029
        select:d=>(getValues('payroll.PAYROLL_CODE')!='28029')?d:d.filter(b=>(b[0]=='T'))
    });

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    /*useEffect(() => {
        // Set Benefit Flag to 'T' if payroll = 28029 **TODO: this should probably be done somewhere else
        if (watchPayroll!='28029'&&!benefitcodes.data) return;
        setValue(`${name}.BENEFIT_FLAG.id`,'T');
    },[watchPayroll,benefitcodes]);*/

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Benefits Flag*:</Form.Label>
            <Col xs="auto">
                {benefitcodes.isLoading && <Loading>Loading Data</Loading>}
                {benefitcodes.isError && <Loading isError>Failed to Load</Loading>}
                {benefitcodes.data &&
                    <Controller
                        name={`${name}.BENEFIT_FLAG.id`}
                        control={control}
                        defaultValue={defaultValues[`${name}.BENEFIT_FLAG`]}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!watchHasBenefits||!canEdit}>
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
    const { control, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit } = useHRFormContext();

    const { getListData } = useListsQueries();
    const checksortcodes = getListData('checkSortCodes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Check Sort Codes*:</Form.Label>
            <Col xs="auto">
                {checksortcodes.isLoading && <Loading>Loading Data</Loading>}
                {checksortcodes.isError && <Loading isError>Failed to Load</Loading>}
                {checksortcodes.data &&
                    <Controller
                        name={`${name}.PAYROLL_MAIL_DROP_ID.id`}
                        control={control}
                        defaultValue={defaultValues[`${name}.PAYROLL_MAIL_DROP_ID`]}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                <option></option>
                                {checksortcodes.data.map(c=><option key={c[0]} value={c[0]}>{c[1]}</option>)}
                            </Form.Control>
                        )}
                    />
                }
                <Form.Text muted>Also known as Mail Drop ID</Form.Text>
                <Form.Control.Feedback type="invalid">{get(errors,`${name}.PAYROLL_MAIL_DROP_ID.id.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}
function PositionJustification() {
    const { control, setValue, formState: { defaultValues } } = useFormContext();
    const { canEdit } = useHRFormContext();

    const { getListData } = useListsQueries();
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
                        defaultValue={defaultValues[`${name}.justification`]}
                        render={({field}) => (
                            <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
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