import { HBoxLayout, VBoxLayout } from "@fi-sci/misc";
import { FunctionComponent, useEffect, useState } from "react";
import ApplicationBar, { applicationBarHeight } from "./ApplicationBar";
import GitHubAuthPage from "./GitHub/GitHubAuthPage";
import HelpPanel from "./HelpPanel/HelpPanel";
import RecentProjectsPanel from "./RecentProjectsPanel/RecentProjectsPanel";
import { Splitter } from "@fi-sci/splitter";
import AboutPage from "./pages/AboutPage/AboutPage";
import AdminPage from "./pages/AdminPage/AdminPage";
import ComputeResourcePage from "./pages/ComputeResourcePage/ComputeResourcePage";
import ComputeResourcesPage from "./pages/ComputeResourcesPage/ComputeResourcesPage";
import DandiBrowser from "./pages/DandiBrowser/DandiBrowser";
import ProjectPage from "./pages/ProjectPage/ProjectPage";
import ProjectsPage from "./pages/ProjectsPage/ProjectsPage";
import RegisterComputeResourcePage from "./pages/RegisterComputeResourcePage/RegisterComputeResourcePage";
import useRoute from "./useRoute";
import useWindowDimensions from "./useWindowDimensions";
import ImportDandiAssetPage from "./pages/ImportDandiAssetPage/ImportDandiAssetPage";
import { DendroProject } from "./types/dendro-types";
import HomePage from "./pages/HomePage/HomePage";

type Props = {
    // none
}

const MainWindow: FunctionComponent<Props> = () => {
    const {width, height} = useWindowDimensions()
    const H1 = applicationBarHeight
    const H2 = height - applicationBarHeight
    const [contextTitle, setContextTitle] = useState<string | undefined>(undefined)
    return (
        <VBoxLayout
            width={width}
            heights={[H1, H2]}
        >
            <ApplicationBar
                contextTitle={contextTitle}
            />
            <MainContent
                width={0} // filled in by VBoxLayout
                height={0} // filled in by VBoxLayout
                onContextTitle={setContextTitle}
            />
        </VBoxLayout>
    )
}

type MainContentProps = {
    width: number
    height: number
    onContextTitle: (contextTitle: string | undefined) => void
}

const MainContent: FunctionComponent<MainContentProps> = ({width, height, onContextTitle}) => {
    const [rightPanelExpanded, setRightPanelExpanded] = useState(true)
    const rightPanelWidth = rightPanelExpanded ? calculateRightPanelWidth(width) : 30
    const [currentProject, setCurrentProject] = useState<DendroProject | undefined>(undefined)

    useEffect(() => {
        if (currentProject) {
            onContextTitle(currentProject.name)
        }
        else {
            onContextTitle(undefined)
        }
    }, [currentProject, onContextTitle])

    return (
        <HBoxLayout
            widths={[width - rightPanelWidth, rightPanelWidth]}
            height={height}
        >
            <MainContent2
                width={0}
                height={0}
                onCurrentProjectChanged={setCurrentProject}
            />
            <RightPanel
                width={0}
                height={0}
                expanded={rightPanelExpanded}
                setExpanded={setRightPanelExpanded}
                currentProject={currentProject}
            />
        </HBoxLayout>
    )
}

type RightPanelProps = {
    width: number
    height: number
    expanded: boolean
    setExpanded: (expanded: boolean) => void
    currentProject: DendroProject | undefined
}

const RightPanel: FunctionComponent<RightPanelProps> = ({width, height, expanded, setExpanded, currentProject}) => {
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={2 * height / 3}
        >
            <HelpPanel
                width={0}
                height={0}
                expanded={expanded}
                setExpanded={setExpanded}
                currentProject={currentProject}
            />
            <RecentProjectsPanel
                width={0}
                height={0}
                expanded={expanded}
            />
        </Splitter>
    )
}

type MainContent2Props = {
    width: number
    height: number
    onCurrentProjectChanged: (project: DendroProject | undefined) => void
}

const MainContent2: FunctionComponent<MainContent2Props> = ({width, height, onCurrentProjectChanged}) => {
    const {route} = useRoute()
    return (
        route.page === 'home' ? (
            <HomePage width={width} height={height} />
        ) : (route.page === 'dandisets' || route.page === 'dandiset') ? (
            <DandiBrowser width={width} height={height} />
        ) : route.page === 'project' ? (
            <ProjectPage width={width} height={height} onCurrentProjectChanged={onCurrentProjectChanged} />
        ) : route.page === 'about' ? (
            <AboutPage width={width} height={height} />
        ) : route.page === 'compute-resource' ? (
            <ComputeResourcePage
                width={width}
                height={height}
                computeResourceId={route.computeResourceId}
            />
        ) : route.page === 'compute-resources' ? (
            <ComputeResourcesPage width={width} height={height} />
        ) : route.page === 'projects' ? (
            <ProjectsPage width={width} height={height} />
        ) : route.page === 'register-compute-resource' ? (
            <RegisterComputeResourcePage />
        ) : route.page === 'importDandiAsset' ? (
            <ImportDandiAssetPage />
        ) : route.page === 'github-auth' ? (
            <GitHubAuthPage />
        ) : route.page === 'admin' ? (
            <AdminPage width={width} height={height} />
        ) : (
            <div>404</div>
        )
    )
}

const calculateRightPanelWidth = (width: number) => {
    if (width < 800) {
        return 0
    }
    else if (width < 1200) {
        return 300
    }
    else if (width < 1600) {
        return 300
    } {
        return 500
    }
}

export default MainWindow