import { Hyperlink } from "@fi-sci/misc";
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window";
import { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import ComputeResourceNameDisplay from "../../../ComputeResourceNameDisplay";
import { useGithubAuth } from "../../../GithubAuth/useGithubAuth";
import UserIdComponent from "../../../UserIdComponent";
import { DendroProcessingJobDefinition, defaultJobDefinition, fetchJob } from "../../../dbInterface/dbInterface";
import { DendroJob } from "../../../types/dendro-types";
import EditJobDefinitionWindow from "../EditJobDefinitionWindow/EditJobDefinitionWindow";
import ResourceUtilizationView from "../ResourceUtilizationView/ResourceUtilizationView";
import { SaveParametersBar } from "../RunBatchSpikeSortingWindow/RightColumn";
import { ElapsedTimeComponent } from "../FileView/FileViewTable";

type Props = {
    width: number,
    height: number,
    jobId: string
}

const useJob = (jobId: string) => {
    const [job, setJob] = useState<DendroJob | undefined>()

    const [refreshCode, setRefreshCode] = useState(0)
    const refreshJob = useCallback(() => {
        setRefreshCode(rc => rc + 1)
        setRefreshConsoleOutputCode(rc => rc + 1)
    }, [])

    const [refreshConsoleOutputCode, setRefreshConsoleOutputCode] = useState(0)
    const refreshConsoleOutput = useCallback(() => {
        setRefreshConsoleOutputCode(rc => rc + 1)
    }, [])

    const [jobConsoleOutput, setJobConsoleOutput] = useState<string | undefined>()

    const auth = useGithubAuth()

    useEffect(() => {
        let canceled = false
        ;(async () => {
            setJob(undefined)
            if (!jobId) return
            const job = await fetchJob(jobId, auth)
            if (canceled) return
            setJob(job)
        })()
        return () => {
            canceled = true
        }
    }, [jobId, auth, refreshCode])
    useEffect(() => {
        if (!job) return
        if (!job.consoleOutputUrl) return
        ;(async () => {
            const resp = await fetch(job.consoleOutputUrl || '')
            if (resp.ok) {
                const text = await resp.text()
                setJobConsoleOutput(text)
            }
        })()
    }, [job, refreshConsoleOutputCode])
    return {job, refreshJob, jobConsoleOutput, refreshConsoleOutput}
}

const JobView: FunctionComponent<Props> = ({ width, height, jobId }) => {
    const {job, refreshJob, jobConsoleOutput, refreshConsoleOutput} = useJob(jobId)
    const secretParameterNames = useMemo(() => {
        if (!job) return []
        return job.processorSpec.parameters.filter(p => p.secret).map(p => p.name)
    }, [job])
    const jobDefinition: DendroProcessingJobDefinition = useMemo(() => {
        if (!job) return defaultJobDefinition
        const ret: DendroProcessingJobDefinition = {
            inputFiles: job.inputFiles.map(f => ({
                name: f.name,
                fileName: f.fileName,
                isFolder: f.isFolder
            })),
            outputFiles: job.outputFiles.map(f => ({
                name: f.name,
                fileName: f.fileName,
                isFolder: f.isFolder,
                skipCloudUpload: f.skipCloudUpload
            })),
            inputParameters: job.inputParameters.map(p => ({
                name: p.name,
                value: p.value
            })),
            processorName: job.processorName
        }
        return ret
    }, [job])

    const exportJson = useCallback(() => {
        if (!job) return
        downloadJson(JSON.stringify(job, null, 2), `dendro-job-${job.jobId}.json`)
    }, [job])

    const {visible: resourceUtilizationVisible, handleOpen: openResourceUtilization, handleClose: closeResourceUtilization} = useModalWindow()

    if (!job) {
        return (
            <p>Loading job {jobId}</p>
        )
    }
    return (
        <div style={{position: 'absolute', width, height, background: 'white', overflowY: 'auto'}}>
            <hr />
            <button onClick={refreshJob}>Refresh</button>
            &nbsp;
            <button onClick={exportJson}>Export job as JSON</button>
            <hr />
            <table className="table1">
                <tbody>
                    <tr>
                        <td>Job ID:</td>
                        <td>{job.jobId}</td>
                    </tr>
                    <tr>
                        <td>User:</td>
                        <td><UserIdComponent userId={job.userId} /></td>
                    </tr>
                    <tr>
                        <td>Processor:</td>
                        <td>{job.processorName}</td>
                    </tr>
                    <tr>
                        <td>Compute resource:</td>
                        <td><ComputeResourceNameDisplay computeResourceId={job.computeResourceId} link={true} /></td>
                    </tr>
                    <tr>
                        <td>Job status:</td>
                        <td>{job.status}</td>
                    </tr>
                    <tr>
                        <td>Error:</td>
                        <td style={{color: 'red'}}>{job.error}</td>
                    </tr>
                    <tr>
                        <td>Elapsed time (sec):</td>
                        <td><ElapsedTimeComponent job={job} /></td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <ExpandableSection title="Files" defaultExpanded={true}>
                <EditJobDefinitionWindow
                    processor={job.processorSpec}
                    jobDefinition={jobDefinition}
                    readOnly={true}
                    show={'inputs+outputs'}
                    fileLinks={true}
                />
            </ExpandableSection>
            <hr />
            <ExpandableSection title="Parameters">
                <div>
                    <SaveParametersBar
                        jobDefinition={jobDefinition}
                        processor={job.processorSpec}
                        onLoadParameters={undefined}
                    />
                    <EditJobDefinitionWindow
                        processor={job.processorSpec}
                        jobDefinition={jobDefinition}
                        secretParameterNames={secretParameterNames}
                        readOnly={true}
                        show={'parameters'}
                        fileLinks={true}
                    />
                </div>
            </ExpandableSection>
            <hr />
            <ExpandableSection title="Resource utilization" defaultExpanded={false}>
                <>
                    <div>
                        <div>&nbsp;</div>
                        <Hyperlink onClick={openResourceUtilization}>Open enlarged view</Hyperlink>
                        <div>&nbsp;</div>
                        <ResourceUtilizationView
                            job={job}
                            displayJobId={false}
                        />
                    </div>
                </>
            </ExpandableSection>
            <hr />
            <ExpandableSection title="Console output" defaultExpanded={true}>
                <div>
                    <button onClick={refreshConsoleOutput}>Refresh</button>
                    <div style={{position: 'relative', maxHeight: determineMaxHeightForConsoleOutputBasedOnHeight(height), overflowY: 'auto'}}>
                        <pre style={{fontSize: 10}}>
                            {jobConsoleOutput}
                        </pre>
                    </div>
                </div>
            </ExpandableSection>
            <hr />
            <ModalWindow
                visible={resourceUtilizationVisible}
                onClose={closeResourceUtilization}
            >
                <ResourceUtilizationView
                    job={job}
                    displayJobId={true}
                />
            </ModalWindow>
        </div>
    )
}

type ExpandableSectionProps = {
    title: string
    defaultExpanded?: boolean
}

export const ExpandableSection: FunctionComponent<PropsWithChildren<ExpandableSectionProps>> = ({ title, children, defaultExpanded }) => {
    const [expanded, setExpanded] = useState(false)
    useEffect(() => {
        if (defaultExpanded) setExpanded(true)
    }, [defaultExpanded])
    return (
        <div>
            <div style={{ cursor: 'pointer' }} onClick={() => { setExpanded(!expanded) }}>{expanded ? '▼' : '►'} {title}</div>
            {
                expanded && (
                    <div>
                        {children}
                    </div>
                )
            }
        </div>
    )
}

const determineMaxHeightForConsoleOutputBasedOnHeight = (height: number) => {
    if (height < 500) {
        return Math.max(200, height - 200)
    }
    else if (height < 1000) {
        return Math.max(400, height - 400)
    }
    else {
        return Math.max(600, height - 600)
    }
}

const downloadJson = (json: string, fileName: string) => {
    const blob = new Blob([json], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
}

export default JobView