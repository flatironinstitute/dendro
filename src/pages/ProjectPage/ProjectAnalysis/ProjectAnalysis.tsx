import { FunctionComponent, useEffect, useState } from "react"
import { useProject } from "../ProjectPageContext"
import AnalysisSourceClient from "./AnalysisSourceClient"
import { Splitter } from "@fi-sci/splitter"
import AnalysisSourceFileBrowser from "./AnalysisSourceFileBrowser"
import AnalysisSourceFileView from "./AnalysisSourceFileView"

type ProjectAnalysisProps = {
    width: number
    height: number
}

const ProjectAnalysis: FunctionComponent<ProjectAnalysisProps> = ({width, height}) => {
    const {project} = useProject()
    const analysisSourceUrl = project?.analysisSourceUrl

    const {analysisSourceClient, status} = useAnalysisSourceClient(analysisSourceUrl)

    if (!project) {
        return (
            <div style={{width, height, padding: 20}}>
                <span style={{fontSize: 20}}>Loading project...</span>
            </div>
        )
    }

    if (!analysisSourceUrl) {
        return (
            <div style={{width, height, padding: 20}}>
                <span style={{fontSize: 20}}>This project does not have a linked analysis source URL.</span>
            </div>
        )
    }

    if (!analysisSourceClient) {
        return (
            <div style={{width, height, padding: 20}}>
                <span style={{fontSize: 20}}>Loading analysis source: {status}</span>
            </div>
        )
    }

    return (
        <ProjectAnalysisChild
            width={width}
            height={height}
            analysisSourceClient={analysisSourceClient}
        />
    )
}

const useAnalysisSourceClient = (analysisSourceUrl: string | undefined) => {
    const [status, setStatus] = useState<string | undefined>('')
    const [analysisSourceClient, setAnalysisSourceClient] = useState<AnalysisSourceClient | undefined>(undefined)
    useEffect(() => {
        let canceled = false
        ; (async () => {
            if (!analysisSourceUrl) return
            setStatus('loading')
            const client = await AnalysisSourceClient.create(analysisSourceUrl, setStatus)
            if (canceled) return
            setAnalysisSourceClient(client)
        })()
        return () => {canceled = true}
    }, [analysisSourceUrl])
    return {analysisSourceClient, status}
}

type ProjectAnalysisChildProps = {
    width: number
    height: number
    analysisSourceClient: AnalysisSourceClient
}

const ProjectAnalysisChild: FunctionComponent<ProjectAnalysisChildProps> = ({width, height, analysisSourceClient}) => {
    const initialSplitterPosition = 250
    const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined)
    return (
        <Splitter
            width={width}
            height={height}
            direction="horizontal"
            initialPosition={initialSplitterPosition}
        >
            <AnalysisSourceFileBrowser
                width={0}
                height={0}
                analysisSourceClient={analysisSourceClient}
                onOpenFile={setCurrentFileName}
            />
            <AnalysisSourceFileView
                width={0}
                height={0}
                analysisSourceClient={analysisSourceClient}
                fileName={currentFileName}
            />
        </Splitter>
    )
}

export default ProjectAnalysis