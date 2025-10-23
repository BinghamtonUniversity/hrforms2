import React, { useEffect, useMemo } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext, useHRFormContext } from "../../config/form";
import { Loading, DepartmentSelector, PersonPickerComponent } from "../components";
import { Icon } from "@iconify/react";
import DatePicker from "react-datepicker";
import useListsQueries from "../../queries/lists";
import { get } from "lodash";
import { FormFieldErrorMessage } from "../../pages/form";

const baseName = 'employment.appointment';

export default function EmploymentAppointment() {
    const { canEdit, activeNav } = useHRFormContext();

    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const watchPayroll = useWatch({name:['payroll.PAYROLL_CODE','selectedRow.PAYROLL_AGENCY_CODE'],control:control});
    const watchFaculty = useWatch({name:`${baseName}.DERIVED_FAC_TYPE`,control:control});
    const watchAdjunct = useWatch({name:`${baseName}.isAdjunct`,control:control});
    const watchTermDuration = useWatch({name:`${baseName}.TERM_DURATION`,control:control,defaultValue:"1"});
    const watchFields = useWatch({name:[
        'payroll.PAYROLL_CODE',
        'employment.position.APPOINTMENT_TYPE.id',
        `${baseName}.DERIVED_FAC_TYPE`,
        `${baseName}.TENURE_STATUS.id`,
    ],contorl:control});

    const handleRangeChange = e => {
        const value = (parseInt(e.target.value,10)<=5)?parseInt(e.target.value,10):5;
        setValue(`${baseName}.TERM_DURATION`,value);
    }

    const handleTermDuration = (e,field) => {
        switch(e.type) {
            case "change":
                if (e.target.value != "" && (e.target.value < 1 || e.target.value > 5)) return false;
                field.onChange(e);
                break;
            case "blur":
                if (!e.target.value) setValue(field.name,1);
        }
    }

    const { getListData } = useListsQueries();
    const tenure = getListData('tenureStatus');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }
    const displayTermDuration = useMemo(() => {
        if (watchFields[0] == '28020'&&['TEMP','TERM'].includes(watchFields[1])) {
            if (watchFields[2]=='Y'&&['R','N'].includes(watchFields[3])) return true;
            if (watchFields[2]!='Y') return true;
        }
        return false;
    },[watchFields]);

    useEffect(() => {
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);

    return (
        <HRFormContext.Consumer>
            {({showInTest,testHighlight,canEdit}) => (
                <article className="mt-3">
                    <Row as="header">
                        <Col as="h3">Appointment Details</Col>
                    </Row>
                    {((watchPayroll[0]=='28020'&&watchPayroll[1]=='')||showInTest) &&
                        <Form.Group as={Row} className={testHighlight((watchPayroll[0]=='28020'&&watchPayroll[1]==''))}>
                            <Form.Label column md={2}>Faculty*:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${baseName}.DERIVED_FAC_TYPE`}
                                    defaultValue={defaultValues[`${baseName}.DERIVED_FAC_TYPE`]}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=='Y'} disabled={!canEdit}/>
                                            <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!='Y'} disabled={!canEdit}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {(watchFaculty=='Y'||showInTest) &&
                        <>
                        <Form.Group as={Row} className={testHighlight(watchFaculty=='Y')}>
                            <Form.Label column md={2}>Adjunct*:</Form.Label>
                            <Col xs="auto">
                            <Controller
                                    name={`${baseName}.isAdjunct`}
                                    defaultValue={defaultValues[`${baseName}.isAdjunct`]}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=='Y'} disabled={!canEdit}/>
                                            <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!='Y'} disabled={!canEdit}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} className={testHighlight(watchFaculty=='Y')}>
                            <Form.Label column md={2}>Tenure Status*:</Form.Label>
                            <Col xs="auto">
                                {tenure.isLoading && <Loading>Loading Data</Loading>}
                                {tenure.isError && <Loading isError>Failed to Load</Loading>}
                                {tenure.data &&
                                    <Controller
                                        name={`${baseName}.TENURE_STATUS.id`}
                                        control={control}
                                        defaultValue={defaultValues[`${baseName}.TENURE_STATUS`]}
                                        render={({field}) => (
                                            <>
                                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                                    <option></option>
                                                    {tenure.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                                </Form.Control>
                                            </>
                                        )}
                                    />
                                }
                                <FormFieldErrorMessage fieldName={`${baseName}.TENURE_STATUS.id`}/>
                            </Col>
                        </Form.Group>
                        </>
                    }
                    {(displayTermDuration||showInTest) && 
                        <Form.Group as={Row} className={testHighlight(displayTermDuration)}>
                            <Form.Label column md={2}>Term Duration*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${baseName}.TERM_DURATION`}
                                    defaultValue={defaultValues[`${baseName}.TERM_DURATION`]}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="number" min={1} max={5} onBlur={e=>handleTermDuration(e,field)} onChange={e=>handleTermDuration(e,field)} disabled={!canEdit} />}
                                />
                            </Col>
                            <Col sm={8} md={6} className="pt-2">
                                <Form.Control type="range" name="termDurationRange" id="termDurationRange" min={1} max={5} value={watchTermDuration} onChange={handleRangeChange} disabled={!canEdit} list="markers"/>
                                <datalist id="markers" className="marker" style={{padding:"0 0.2rem"}}>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </datalist>
                            </Col>
                        </Form.Group>
                    }
                    {(getValues(`${baseName}.NOTICE_DATE`)||showInTest) && 
                        <>
                            {(getValues(`${baseName}.NOTICE_DATE`)||showInTest) && 
                                <Form.Group as={Row} className={testHighlight(getValues(`${baseName}.NOTICE_DATE`))}>
                                    <Form.Label column md={2}>Notice Date:</Form.Label>
                                    <Col xs="auto">
                                    <InputGroup>
                                        <Controller
                                            name={`${baseName}.noticeDate`}
                                            defaultValue={defaultValues[`${baseName}.noticeDate`]}
                                            control={control}
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
                            }
                            {(getValues(`${baseName}.CONTINUING_PERMANENCY_DATE`)||showInTest) &&
                                <Form.Group as={Row} className={testHighlight(getValues(`${baseName}.CONTINUING_PERMANENCY_DATE`))}>
                                    <Form.Label column md={2}>Continuing/Permanency Date:</Form.Label>
                                    <Col xs="auto">
                                    <InputGroup>
                                        <Controller
                                            name={`${baseName}.contPermDate`}
                                            defaultValue={defaultValues[`${baseName}.contPermDate`]}
                                            control={control}
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
                            }
                        </>
                    }
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Campus Title:</Form.Label>
                        <Col xs={10} sm={9} md={8} lg={6} xl={5}>
                            <Controller
                                name={`${baseName}.CAMPUS_TITLE`}
                                defaultValue={defaultValues[`${baseName}.CAMPUS_TITLE`]}
                                control={control}
                                render={({field})=><Form.Control {...field} type="text" disabled={!canEdit}/>}
                            />
                        </Col>
                    </Form.Group>

                    <AppointmentSupervisor/>

                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Department*:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${baseName}.REPORTING_DEPARTMENT_CODE.id`}
                                control={control}
                                defaultValue={defaultValues[`${baseName}.REPORTING_DEPARTMENT_CODE`]}
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                            />
                            <FormFieldErrorMessage fieldName={`${baseName}.REPORTING_DEPARTMENT_CODE.id`}/>
                        </Col>
                    </Form.Group>

                    {((watchFaculty=='Y'&&watchAdjunct=='Y')||showInTest)&&<FacultyDetails watchFaculty={watchFaculty} watchAdjunct={watchAdjunct}/>}

                    {(watchPayroll[0]=='28029'||showInTest)&&<StudentDetails watchPayroll={watchPayroll} handleSelectChange={handleSelectChange}/>}
                </article>
            )}
        </HRFormContext.Consumer>
    );
}
function AppointmentSupervisor() {
    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit } = useHRFormContext();
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${baseName}.supervisor[0].label`)) {
            setValue(`${baseName}.supervisor.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Supervisor*:</Form.Label>
            <Col xs={10} sm={8} md={6} lg={5} xl={4}>
                <Controller
                    name={`${baseName}.supervisor`}
                    defaultValue={defaultValues[`${baseName}.supervisor`]}
                    control={control}
                    render={({field}) => <PersonPickerComponent 
                        field={field} 
                        id="supervisor-search" 
                        placeholder="Search for Supervisor" 
                        onBlur={e=>handleBlur(field,e)} 
                        disabled={!canEdit}/>
                    }
                />
                <FormFieldErrorMessage fieldName={`${baseName}.supervisor`}/>
            </Col>
        </Form.Group>
    );
}

function FacultyDetails({watchFaculty,watchAdjunct}) {
    const name = `${baseName}.facultyDetails`;
    const maxCourses = 3;

    const { control, setValue, formState: { defaultValues, errors } } = useFormContext();
    const watchCourses = useWatch({name:[`${name}.fallCourses`,`${name}.springCourses`,],control:control});

    const handleCountChange = (e,field) => {
        if (parseInt(e.target.value,10) < 0 || parseInt(e.target.value,10) > maxCourses) return false;
        field.onChange(e);
    }
    const handleCountBlur = (e,field) => {
        if (!e.target.value) setValue(field.name,'0');
    }

    const handleRangeChange = (e,fieldName) => setValue(fieldName,e.target.value);

    return (
        <HRFormContext.Consumer>
            {({testHighlight,canEdit}) => (
                <section className={`mt-4 ${testHighlight(watchFaculty=='Y'&&watchAdjunct=='Y')}`}>
                    <Row as="header">
                        <Col as="h4">Faculty Details</Col>
                    </Row>
                    {[
                        {id:'fallCourses',label:'Fall Courses'},
                        {id:'springCourses',label:'Spring Courses'}
                    ].map((c,i) => (
                        <div key={c.id} id={c.id}>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label}*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.count`}
                                        defaultValue={defaultValues[`${name}.${c.id}.count`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} max={maxCourses} onChange={e=>handleCountChange(e,field)} onBlur={e=>handleCountBlur(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                                    />
                                    <FormFieldErrorMessage fieldName={`${name}.${c.id}.count`}/>
                                </Col>
                                <Col sm={8} md={6} className="pt-2">
                                    <Form.Control type="range" name={`${c.id}Range`} id={`${c.id}Range`} min={0} max={maxCourses} value={watchCourses[i].count} onChange={e=>handleRangeChange(e,`${name}.${c.id}.count`)} disabled={!canEdit} list={`markers-${c.id}`}/>
                                    <datalist id={`markers-${c.id}`} className="marker" style={{padding:"0 0.2rem"}}>
                                        <option value="0">0</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value={maxCourses}>{maxCourses}</option>
                                    </datalist>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>Credits*:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.credits`}
                                        defaultValue={defaultValues[`${name}.${c.id}.credits`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit||watchCourses[i].count==0}/>}
                                    />
                                    <FormFieldErrorMessage fieldName={`${name}.${c.id}.credits`}/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} List*:</Form.Label>
                                <Col md={9}>
                                    <Controller
                                        name={`${name}.${c.id}.list`}
                                        defaultValue={defaultValues[`${name}.${c.id}.list`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} as="textarea" rows={5} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit||watchCourses[i].count==0}/>}
                                    />
                                    <FormFieldErrorMessage fieldName={`${name}.${c.id}.list`}/>
                                </Col>
                            </Form.Group>
                        </div>
                    ))}
                </section>
            )}
        </HRFormContext.Consumer>
    );
}

function StudentDetails({watchPayroll,handleSelectChange}) {
    const name = `${baseName}.studentDetails`;
    const maxCredits = 20;

    const { control, getValues, setValue, formState: { defaultValues } } = useFormContext();
    const watchCredits = useWatch({name:[`${name}.fall.credits`,`${name}.spring.credits`,],control:control})||0;
    const watchFellowship = useWatch({name:`${name}.fellowship`,control:control});
    const data = getValues(name);

    const handleCreditsChange = (e,field) => {
        switch (e.type) {
            case "change":
                if (e.target.value != "" && (parseInt(e.target.value,10)<0 || parseInt(e.target.value,10)>maxCredits)) return false;
                field.onChange(e);
                break;
            case "blur":
                if (!e.target.value) setValue(field.name,0);
        }
    }
    const handleRangeChange = (e,fieldName) => setValue(fieldName,e.target.value);

    const { getListData } = useListsQueries();
    const fellowshipsources = getListData('fellowshipSources');

    useEffect(()=>watchFellowship=='N' && setValue(`${name}.fellowshipSource`,{"id":"","label":""}),[watchFellowship]);
    return (
        <HRFormContext.Consumer>
            {({testHighlight,canEdit,showInTest}) => (
                <section className={`mt-4 ${testHighlight(watchPayroll[0]=='28029')}`}>
                    <Row as="header">
                        <Col as="h4">Student Details</Col>
                    </Row>
                    <Row as="dl">
                        <Col as="dt" sm={2} className="mb-0">GPA:</Col>
                        <Col as="dd" sm={4} className="mb-0">{Number.parseFloat(data.SHRLGPA_GPA).toFixed(2)}</Col>
                        <Col as="dt" sm={2} className="mb-0">Incompletes:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.INCOMPLETES}</Col>
                        <Col as="dt" sm={2} className="mb-0">Missing Grades:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.MISSING_GRADES}</Col>
                        <Col as="dt" sm={2} className="mb-0">Grade Level</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVCLAS_CODE} - {data.STVCLAS_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Last Term:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVTERM_DESC} ({data.SGBSTDN_TERM_CODE_EFF})</Col>
                        <Col as="dt" sm={2} className="mb-0">Program:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.SMRPRLE_PROGRAM_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Major:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVMAJR_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Academic History:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.ACAD_HIST}</Col>
                        <Col as="dt" sm={2} className="mb-0">Residency:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVRESD_DESC} / {data.STVRESD_IN_STATE_DESC}</Col>
                    </Row>
                    {[
                        {id:'fall',label:'Fall'},
                        {id:'spring',label:'Spring'}
                    ].map((c,i) => (
                        <div key={c.id} id={c.id}>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} Tuition:</Form.Label>
                                <Col xs={12} sm={6} md={4} lg={3}>
                                    <Controller
                                        name={`${name}.${c.id}.tuition`}
                                        defaultValue={defaultValues[`${name}.${c.id}.tuition`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="text" disabled={!canEdit}/>}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} Credits:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.credits`}
                                        defaultValue={defaultValues[`${name}.${c.id}.credits`]}
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} max={maxCredits} onBlur={e=>handleCreditsChange(e,field)} onChange={e=>handleCreditsChange(e,field)} disabled={!canEdit}/>}
                                    />
                                </Col>
                                <Col sm={8} md={6} className="pt-2">
                                    <Form.Control type="range" name={`${c.id}CreditsRange`} id={`${c.id}CreditsRange`} min={0} max={maxCredits} value={watchCredits[i]} onChange={e=>handleRangeChange(e,`${name}.${c.id}.credits`)} disabled={!canEdit} list={`markers-${c.id}`}/>
                                    <datalist id={`markers-${c.id}`} className="marker" style={{padding:"0 0.2rem"}}>
                                        <option value="0">0</option>
                                        <option value="5" style={{marginLeft:'7px'}}>5</option>
                                        <option value="10" style={{marginLeft:'5px'}}>10</option>
                                        <option value="15" style={{marginLeft:'3px'}}>15</option>
                                        <option value={maxCredits}>{maxCredits}</option>
                                    </datalist>
                                </Col>
                            </Form.Group>
                        </div>
                    ))}
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Receiving Fellowship:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.fellowship`}
                                defaultValue={defaultValues[`${name}.fellowship`]}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=='Y'} disabled={!canEdit}/>
                                        <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!='Y'} disabled={!canEdit}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Form.Group>
                    {(watchFellowship=='Y'||showInTest) && 
                        <Form.Group as={Row} className={testHighlight(watchFellowship=='Y')}>
                            <Form.Label column md={2}>Source of Fellowship:</Form.Label>
                            <Col xs="auto">
                                {fellowshipsources.isLoading && <Loading>Loading Data</Loading>}
                                {fellowshipsources.isError && <Loading isError>Failed to Load</Loading>}
                                {fellowshipsources.data &&
                                    <Controller
                                        name={`${name}.fellowshipSource.id`}
                                        defaultValue={defaultValues[`${name}.fellowshipSource`]}
                                        control={control}
                                        render={({field}) => (
                                            <>
                                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                                    <option></option>
                                                    {fellowshipsources.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                                </Form.Control>
                                            </>
                                        )}
                                    />
                                }
                            </Col>
                        </Form.Group>
                    }
                </section>
            )}
        </HRFormContext.Consumer>
    );
}