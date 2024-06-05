import {startOfWeek, endOfWeek, addDays, formatDate, parse, format} from "date-fns";


export class WeeksInput {
    private weeks:string[];
    private readonly inputSelector:string;
    private readonly pickerSelector:string;
    private onChange:(weeks:string[]) => void = (_:string[]) => {
    };

    private currentSelectionStart:string;
    private currentSelectionEnd:string;

    constructor(weeks:string[], inputSelector:string, pickerSelector:string, currentSelectionStart?:string, currentSelectionEnd?:string) {
        this.weeks = weeks;
        this.inputSelector = inputSelector;
        this.pickerSelector = pickerSelector;
        this.currentSelectionStart = currentSelectionStart;
        this.currentSelectionEnd = currentSelectionEnd;
    }

    public setOnChange(onChange:(weeks:string[]) => void) {
        this.onChange = onChange;
    }

    public setWeeks(weeks:string[]) {
        this.weeks = weeks;
        this.currentSelectionStart = undefined;
        this.currentSelectionEnd = undefined;
        this.renderPicker();
    }

    public render() {
        this.renderInput();
        this.renderPicker();
    }

    private renderInput() {
        const $input = jQuery(this.inputSelector);
        $input.on("click", () => {
            if(jQuery(this.pickerSelector).is(":visible")) {
                jQuery(this.pickerSelector).hide();
            } else {
                jQuery(this.pickerSelector).show();
            }
        });
        this.updateInput();
    }

    private updateInput() {
        const $input = jQuery(this.inputSelector);
        const text = `${this.currentSelectionStart} - ${this.currentSelectionEnd}`;
        $input.val(text);
    }

    private renderPicker() {
        if(!this.currentSelectionStart || !this.currentSelectionEnd){
            this.selectWholePeriod();
        }
        this.updatePicker();
        this.applySelection();

        const $picker = jQuery(this.pickerSelector);
        $picker.find(".lastWeek").on("click", () => {
            this.selectLastWeek();
            this.applySelection();
        });
        $picker.find(".wholePeriod").on("click", () => {
            this.selectWholePeriod();
            this.applySelection();
        });

        jQuery(".weekButton").on("click", (event) => {
            console.log("Week button clicked");

            // get the week from the button
            const week = jQuery(event.target).data("week");

            // if there's existing start and end selection, clear them
            if(this.currentSelectionStart && this.currentSelectionEnd) {
                this.currentSelectionStart = undefined;
                this.currentSelectionEnd = undefined;
            }

            // if currentSelectionStart is not set, set it to the week
            if(!this.currentSelectionStart) {
                this.currentSelectionStart = week;
                jQuery(".weekButton").removeClass("selected");
                jQuery(event.target).addClass("selected");
            } else {
                // if currentSelectionStart is set, set currentSelectionEnd to the week
                this.currentSelectionEnd = week;
                // if currentSelectionStart is after currentSelectionEnd, swap them
                if(this.currentSelectionStart > this.currentSelectionEnd) {
                    [this.currentSelectionStart, this.currentSelectionEnd] = [this.currentSelectionEnd, this.currentSelectionStart];
                }

                this.currentSelectionEnd = format(addDays(parse(this.currentSelectionEnd, "yyyy-MM-dd", new Date()), 6), "yyyy-MM-dd");

                this.applySelection();
            }
        });
    }

    private updatePicker() {
        const $picker = jQuery(this.pickerSelector);
        // for each week, show a div
        $picker.find(".weeks").html(this.weeks.map((week:string) => {
            // const start = new Date(week);
            // const end = addDays(start, 6);
            // const text = `${formatDate(start, "yyyy-MM-dd")} - ${formatDate(end, "yyyy-MM-dd")}`;
            // return `<div class="week" data-start="${start}" data-end="${end}">${text}</div>`;
            // language=HTML
            return `<div class="col-3">
                <button class="weekButton" data-week="${week}">${week}</button>
            </div>`;
        }).join(""));
    }

    private selectLastWeek() {
        this.currentSelectionStart = format(startOfWeek(addDays(new Date(), -7), {weekStartsOn: 1}), "yyyy-MM-dd");
        this.currentSelectionEnd = format(addDays(this.currentSelectionStart, 6), "yyyy-MM-dd");
    }

    private selectWholePeriod() {
        this.currentSelectionStart = this.weeks[0];
        let lastWeekStart = parse(this.weeks[this.weeks.length-1], "yyyy-MM-dd", new Date());
        this.currentSelectionEnd = format(addDays(lastWeekStart, 6), "yyyy-MM-dd");
    }

    private applySelection() {
        // get the weeks between currentSelectionStart and currentSelectionEnd
        const weeks = this.weeks.filter((week:string) => {
            return this.currentSelectionStart <= week && week <= this.currentSelectionEnd;
        });

        console.log("Selected weeks: ", weeks);

        jQuery(".weekButton").removeClass("selected");
        // add "selected" class to all the weeks between currentSelectionStart and currentSelectionEnd
        weeks.forEach((week:string) => {
            jQuery(`.weekButton[data-week="${week}"]`).addClass("selected");
        });

        this.updateInput();

        this.onChange(weeks);
        jQuery(this.pickerSelector).hide();
    }

    public getSelectedWeeks():string[] {
        return this.weeks.filter((week:string) => {
            return this.currentSelectionStart <= week && week <= this.currentSelectionEnd;
        });
    }
}
