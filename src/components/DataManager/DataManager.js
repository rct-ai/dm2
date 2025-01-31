import { inject, observer } from "mobx-react";
import React, { useEffect, useState } from 'react';
import { LSPlus } from "../../assets/icons";
import { Block, Elem } from "../../utils/bem";
import { Interface } from "../Common/Interface";
import { Space } from "../Common/Space/Space";
import { Spinner } from "../Common/Spinner";
import { Tabs, TabsItem } from "../Common/Tabs/Tabs";
import { FiltersSidebar } from "../Filters/FiltersSidebar/FilterSidebar";
import { DataView } from "../MainView";
import "./DataManager.styl";
import { Toolbar } from "./Toolbar/Toolbar";

const injector = inject(({ store }) => {
  const { sidebarEnabled, sidebarVisible } = store.viewsStore ?? {};

  return {
    shrinkWidth: sidebarEnabled && sidebarVisible,
  };
});

const fetchAPI = async (url, headers) => {
  const response = await fetch(url, { headers });
  const data = await response.json();

  return data;
};

const summaryInjector = inject (({ store }) => {
  const { project, taskStore, viewsStore } = store;
  const [boxes, setBoxes] = useState(0);

  const headers = store.API.commonHeaders;
  const projectId = project.id;
  const viewId = viewsStore.selected.id;
  const url = 'http://192.168.0.181:9000/api/tasks?view=' + viewId +  '&project=' + projectId;
  // const url = 'https://label-studio.dev-metaverse.fun/api/tasks?view=' + viewId +  '&project=' + projectId;

  useEffect(() => {
    (async () => {
      let data = await fetchAPI(url, headers);

      setBoxes(data.boxes);
    })();
  });

  return {
    totalTasks: project?.task_count ?? project?.task_number ?? 0,
    totalFoundTasks: taskStore?.total ?? 0,
    totalAnnotations: taskStore?.totalAnnotations ?? 0,
    totalPredictions: taskStore?.totalPredictions ?? 0,
    cloudSync: project.target_syncing ?? project.source_syncing ?? false,
    boxes,
  };
});

const switchInjector = inject(({ store }) => {
  return {
    views: store.viewsStore,
    tabs: Array.from(store.viewsStore?.all ?? []),
    selectedKey: store.viewsStore?.selected?.key,
  };
});

const ProjectSummary = summaryInjector((props) => {
  return (
    <Space size="large" style={{ paddingRight: "1em", color: "rgba(0,0,0,0.3)" }}>
      {props.cloudSync && (
        <Space
          size="small"
          style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}
        >
          Storage sync
          <Spinner size="small" />
        </Space>
      )}
      <span style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
        <Space size="compact">
          <span>
            Tasks: {props.totalFoundTasks} / {props.totalTasks}
          </span>
          <span>Annotations: {props.totalAnnotations}</span>
          <span>Predictions: {props.totalPredictions}</span>
          <span>Boxes: {props.boxes}</span>
        </Space>
      </span>
    </Space>
  );
});

const TabsSwitch = switchInjector(observer(({ views, tabs, selectedKey }) => {
  return (
    <Tabs
      activeTab={selectedKey}
      onAdd={() => views.addView({ reload: false })}
      onChange={(key) => views.setSelected(key)}
      tabBarExtraContent={<ProjectSummary />}
      addIcon={<LSPlus />}
    >
      {tabs.map((tab) => (
        <TabsItem
          key={tab.key}
          tab={tab.key}
          title={tab.title}
          onFinishEditing={(title) => {
            tab.setTitle(title);
            tab.save();
          }}
          onDuplicate={() => tab.parent.duplicateView(tab)}
          onClose={() => tab.parent.deleteView(tab)}
          onSave={()=> tab.virtual && tab.saveVirtual()}
          active={tab.key === selectedKey}
          editable={tab.editable}
          deletable={tab.deletable}
          virtual={tab.virtual}
        />
      ))}
    </Tabs>
  );
}));

export const DataManager = injector(({ shrinkWidth }) => {
  return (
    <Block name="tabs-content">
      <Elem name="tab" mod={{ shrink: shrinkWidth }}>
        <Interface name="tabs">
          <TabsSwitch />
        </Interface>

        <Interface name="toolbar">
          <Toolbar />
        </Interface>

        <DataView />
      </Elem>
      <FiltersSidebar />
    </Block>
  );
});
