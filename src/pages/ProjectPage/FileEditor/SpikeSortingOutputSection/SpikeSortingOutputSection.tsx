import { FunctionComponent, useCallback, useMemo } from "react";
import { Hyperlink } from "@fi-sci/misc";
import { createJob, DendroProcessingJobDefinition } from "../../../../dbInterface/dbInterface";
import { useGithubAuth } from "../../../../GithubAuth/useGithubAuth";
import { DendroJob, DendroJobRequiredResources } from "../../../../types/dendro-types";
import { useProject } from "../../ProjectPageContext";
import { isElectricalSeriesPathParameter } from "../../EditJobDefinitionWindow/EditJobDefinitionWindow";
import { useModalWindow } from "@fi-sci/modal-window"
import ModalWindow from "@fi-sci/modal-window";
import LoadSpikeSortingInScriptWindow from "./LoadSpikeSortingInScriptWindow";

type SpikeSortingOutputSectionProps = {
    spikeSortingJob: DendroJob
    fileName: string
}

const SpikeSortingOutputSection: FunctionComponent<SpikeSortingOutputSectionProps> = ({spikeSortingJob, fileName}) => {
    const {project, jobs, files, projectId, computeResource} = useProject()

    const recordingFileName = useMemo(() => {
        const output = spikeSortingJob.inputFiles.find(f => f.name === 'input')
        if (!output) return undefined
        return output.fileName
    }, [spikeSortingJob])

    const electricalSeriesPath = useMemo(() => {
        const pp = spikeSortingJob.inputParameters.find(p => (isElectricalSeriesPathParameter(p.name)))
        if (!pp) return undefined
        return pp.value
    }, [spikeSortingJob])

    const recordingFile = useMemo(() => {
        if (!recordingFileName) return undefined
        if (!files) return undefined
        return files.find(f => (f.fileName === recordingFileName))
    }, [recordingFileName, files])

    const sortingFile = useMemo(() => {
        if (!files) return undefined
        return files.find(f => (f.fileName === fileName))
    }, [fileName, files])

    const spikeSortingAnalysisJob = useMemo(() => {
        if (!jobs) return undefined
        return jobs.find(j => {
            if (j.processorName !== 'create_spike_sorting_analysis') return false
            const rr = j.inputFiles.find(f => (f.name === 'recording'))
            const ss = j.inputFiles.find(f => (f.name === 'sorting'))
            const pp = j.inputParameters.find(p => (p.name === 'electrical_series_path'))
            if ((!rr) || (!ss) || (!pp)) return false
            if (rr.fileName !== recordingFileName) return false
            if (ss.fileName !== fileName) return false
            if (pp.value !== electricalSeriesPath) return false
            return true
        })
    }, [jobs, recordingFileName, fileName, electricalSeriesPath])

    const spikeSortingAnalysisFile = useMemo(() => {
        if (!spikeSortingAnalysisJob) return undefined
        if (!files) return undefined
        const ff1 = spikeSortingAnalysisJob.outputFiles.find(f => (f.name === 'output'))
        const ff2 = files.find(f => (f.fileName === ff1?.fileName))
        return ff2
    }, [spikeSortingAnalysisJob, files])

    const spikeSortingAnalysisProcessor = useMemo(() => {
        if (!computeResource) return undefined
        if (!computeResource.spec) return undefined
        for (const app of computeResource.spec.apps) {
            for (const pp of app.processors) {
                if (pp.name === 'create_spike_sorting_analysis') {
                    return pp
                }
            }
        }
        return undefined
    }, [computeResource])

    const auth = useGithubAuth()

    const handlePrepareSpikeSortingView = useCallback(async () => {
        if (!spikeSortingAnalysisProcessor) return
        if (!recordingFileName) return
        if (!electricalSeriesPath) return
        if (!files) return
        const jobDefinition: DendroProcessingJobDefinition = {
            processorName: spikeSortingAnalysisProcessor.name,
            inputFiles: [
                {
                    name: 'recording',
                    fileName: recordingFileName
                },
                {
                    name: 'sorting',
                    fileName
                }
            ],
            outputFiles: [
                {
                    name: 'output',
                    fileName: `.spike_sorting_analysis/${fileName}.nh5`
                }
            ],
            inputParameters: [
                {
                    name: 'electrical_series_path',
                    value: electricalSeriesPath
                }
            ]
        }
        const requiredResources: DendroJobRequiredResources = {
            numCpus: 4,
            numGpus: 0,
            memoryGb: 8,
            timeSec: 3600
        }
        const defaultRunMethod = computeResource?.spec?.defaultJobRunMethod
        if (!defaultRunMethod) {
            throw new Error(`defaultJobRunMethod not found for compute resource: ${computeResource?.computeResourceId}`)
        }
        await createJob({
            projectId,
            jobDefinition,
            processorSpec: spikeSortingAnalysisProcessor,
            files,
            batchId: undefined,
            requiredResources,
            runMethod: defaultRunMethod
        }, auth)
    }, [spikeSortingAnalysisProcessor, projectId, recordingFileName, auth, fileName, electricalSeriesPath, files, computeResource])

    const handleOpenSpikeSortingView = useCallback(async () => {
        if (!spikeSortingAnalysisFile) return
        const c = spikeSortingAnalysisFile.content
        if (!c) return
        if (!c.startsWith('url:')) return
        const url = c.slice('url:'.length)

        // const x = await loadRemoteData(url)
        // if (!x) return
        // if (!x.startsWith('https:')) return
        // window.open(x, '_blank')

        const figureData = {
            type: 'spike_sorting_analysis',
            analysisFile: url
        }
        const url2 = `https://figurl.org/f?v=https://magland.github.io/fi-sci-dist/apps/figurl-spike-sorting-analysis&d=${encodeURI(JSON.stringify(figureData))}` 
        window.open(url2, '_blank')
    }, [spikeSortingAnalysisFile])

    const status = spikeSortingAnalysisJob ? spikeSortingAnalysisJob.status : undefined

    const {visible: loadInScriptVisible, handleOpen: openLoadInScriptWindow, handleClose: closeLoadInScriptWindow} = useModalWindow()

    if (!recordingFile) return <div>Recording file not found</div>
    if (!sortingFile) return <div>Sorting file not found</div>

    let openSpikeSortingViewElement: JSX.Element | undefined = undefined

    if (status === 'completed') {
        openSpikeSortingViewElement = (
            <div>
                <Hyperlink onClick={handleOpenSpikeSortingView}>Open spike sorting view</Hyperlink>
            </div>
        )
    }
    else if (['pending', 'queued', 'starting', 'running'].includes(status || '')) {
        openSpikeSortingViewElement = <div>Spike sorting view: {status}</div>
    }
    else if (status === 'failed') {
        openSpikeSortingViewElement = <div>Error creating spike sorting view</div>
    }
    else if (!spikeSortingAnalysisProcessor) {
        openSpikeSortingViewElement = <div>No spike_sorting_analysis processor found</div>
    }
    else {
        openSpikeSortingViewElement = (
            <Hyperlink
                onClick={handlePrepareSpikeSortingView}
            >
                Prepare spike sorting view
            </Hyperlink>
        )
    }

    return (
        <>
            <div>
                {openSpikeSortingViewElement}
            </div>
            <div>
                <Hyperlink
                    onClick={openLoadInScriptWindow}
                >
                    Load sorting object in script
                </Hyperlink>
            </div>
            <ModalWindow
                visible={loadInScriptVisible}
                onClose={closeLoadInScriptWindow}
            >
                {project && <LoadSpikeSortingInScriptWindow
                    fileName={fileName}
                    project={project}
                    onClose={closeLoadInScriptWindow}
                />}
            </ModalWindow>
        </>
    )
}

const loadRemoteData = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
        console.warn(`Unable to load remote data: ${url}`)
        return undefined
    }
    const text = await response.text()
    return text
}

export default SpikeSortingOutputSection