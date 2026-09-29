# Preset Buttons Pro

FM-DX Webserver 的预设按钮插件，支持多 bank、显示全部、隐藏/显示、自定义电台名、天线保存等功能。

A preset button plugin for FM-DX Webserver. Supports multiple banks, show-all mode, hide/show, custom station names, antenna saving, and more.

![](https://raw.githubusercontent.com/riverklause/FM-DX-Webserver_plugin_ButtonPresetsPro/refs/heads/main/preset_buttons.jpg)

---

## 安装 / Installation

把 `ButtonPresetsPro.js` 文件和 `ButtonPresetsPro` 文件夹都拷贝到 `plugins` 目录。

Copy `ButtonPresetsPro.js` and the `ButtonPresetsPro` folder into the `plugins` directory.

---

## 使用方法 / Usage

### For PC / Android

| 操作                          | 说明                                         |
| --------------------------- | ------------------------------------------ |
| 使用鼠标左键 / 点击                 | 调用预设频率                                     |
| Left-click / Tap            | Recall the preset.                         |
| 右键 / 长按                     | 存储预设频率                                     |
| Right-click / Long Tap      | Store the preset.                          |
| 中键或 SHIFT+单击                | 重置某个预设频率（安卓不可用）                            |
| Middle-click or SHIFT+click | Reset a preset (not available on Android). |
| 双击 / 双点击                    | 编辑频率名称                                     |
| Double-click / Double-Tap   | Edit the station name.                     |

存储预设频率不影响服务器存储和其他浏览器的存储。

Stored presets are saved only in the current browser. They are not written to the server config and do not affect other browsers.

### For iOS

| 操作         | 说明                 |
| ---------- | ------------------ |
| 点击         | 调用预设频率             |
| Tap        | Recall the preset. |
| 长按         | 存储预设频率             |
| Long press | Store the preset.  |

存储预设频率不影响服务器存储和其他浏览器的存储。

Stored presets are saved only in the current browser. They are not written to the server config and do not affect other browsers.

---

## 服务器端配置文件 / Server-side config file

`presets_config.json` 是服务器端的配置文件，示例如下：

`presets_config.json` is the server-side configuration file. Example:

```json
{
  "version": "1.0-mod",
  "exportDate": "2026-04-27T00:00:00.000Z",
  "presetCount": 20,
  "bankQuantity": 4,
  "bankNames": ["A", "新闻", "音乐", ""],
  "bankNameKeys": ["A", "B", "C", "D"],
  "settings": {
    "displayAll": false,
    "hidden": false,
    "savedDefaultBank": "D"
  },
  "banks": {
    "A": { "values": [], "antennas": [], "ps": [], "tooltips": [], "stationNames": [] },
    "B": { "values": [], "antennas": [], "ps": [], "tooltips": [], "stationNames": [] },
    "C": { "values": [], "antennas": [], "ps": [], "tooltips": [], "stationNames": [] },
    "D": { "values": [], "antennas": [], "ps": [], "tooltips": [], "stationNames": [] }
  }
}
```

### 字段说明 / Field descriptions

| 字段                            | 说明                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `"version"`                   | 配置格式版本，通常与插件版本对应。Config format version, usually matching the plugin version.                                          |
| `"exportDate"`                | 导出时间，仅作记录。Export timestamp, for reference only.                                                                       |
| `"presetCount"`               | 每个 bank 的预设数量，默认 20。Number of presets per bank, default 20.                                                           |
| `"bankQuantity"`              | bank 总数，范围 3–8。Total number of banks, range 3–8.                                                                      |
| `"bankNameKeys"`              | bank 的内部标识，固定为 A–H，不可改。Internal bank identifiers, fixed as A–H, do not change.                                        |
| `"bankNames"`                 | bank 的显示名，空字符串表示用默认字母。Display names for each bank; empty string means use the default letter.                         |
| `"settings.displayAll"`       | 是否把预设电台不分 bank 全部显示，一般不全部显示。Whether to show all presets from all banks on screen. Usually false.                      |
| `"settings.hidden"`           | 是否隐藏预设频率功能，一般不隐藏。Whether to hide the preset buttons. Usually false.                                                   |
| `"settings.savedDefaultBank"` | 定义默认 bank，值取自 `"bankNameKeys"`，不可缺少。Default bank to load on startup. Value must be one of `"bankNameKeys"`. Required. |
| `"banks.values"`              | 频率值列表（MHz），每个未设置的预设默认频率为 87.5。Frequency values in MHz. Each unset preset defaults to 87.5.                            |
| `"banks.antennas"`            | 每个预设关联的天线编号，空字符串表示不保存天线。Antenna number associated with each preset; empty string means no antenna is stored.          |
| `"banks.ps"`                  | RDS 自动获得（如有）的电台名，默认为空。RDS PS name obtained automatically if available. Default is empty.                              |
| `"banks.tooltips"`            | 鼠标悬停在频率按钮上时的提示，默认为空。Tooltip shown when hovering over a preset button. Default is empty.                               |
| `"banks.stationNames"`        | 自定义电台名，默认为空。Custom station name. Default is empty.                                                                    |

* * *

说明 / Notes
----------

* `presets_config.json` 仅作为初始默认配置。当浏览器 localStorage 中已有完整设置时，插件不会自动加载服务器配置。用户修改后的状态只保存在当前浏览器的 localStorage 中，不会写回服务器。

* `presets_config.json` is only used as an initial default config. When the browser's localStorage already contains a complete set of settings, the plugin will not auto-load the server config. Changes made by the user are stored only in the current browser's localStorage and are never written back to the server.

* 如需更新服务器默认配置，请使用插件菜单中的“导出配置文件”，下载后手动替换 `presets_config.json`。

* To update the server-side default config, use "Export config" in the plugin menu, download the file, and manually replace `presets_config.json`.

* 点击“从服务器加载”会强制用服务器配置覆盖当前浏览器 localStorage 中的设置。

* Clicking "Load from server" will force-overwrite the current browser's localStorage with the server config.
